import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import type { Camera, DrawingToolId, Stroke } from '../types';
import {
  screenToDoc,
  fitCamera,
  zoomAroundPoint,
  panCamera,
} from '../engine/coordinates';
import {
  createStroke,
  appendPoint,
  hitTestStroke,
} from '../engine/strokes';
import {
  renderScene,
  drawStroke,
  drawGrid,
  drawEraserCursor,
  type ModelRenderInfo,
} from '../engine/render';
import { coalescedEvents, eventToStrokePoint } from '../engine/pointerInput';

/**
 * Surface de dessin (§6) : deux canvas superposés —
 *  - statique : papier + modèle + traits validés (re-rendu seulement si
 *    caméra/traits/réglages changent) ;
 *  - vif : trait en cours, grille, curseur de gomme (couche interface).
 *
 * Entrées : Pointer Events avec capture, événements coalescés, pression du
 * stylet si disponible, priorité stylet > souris > doigt (anti-paume),
 * pincement à deux doigts pour zoomer/déplacer, outil Main.
 */

const ERASER_SCREEN_RADIUS = 16;

type Props = {
  docWidth: number;
  docHeight: number;
  /** Traits validés (lecture seule). */
  strokes: readonly Stroke[];
  /** Invalide le rendu quand les traits changent. */
  strokesVersion: number;
  cameraRef: React.MutableRefObject<Camera>;
  cameraVersion: number;
  onCameraChange: (updater: (c: Camera) => Camera) => void;
  tool: DrawingToolId;
  color: string;
  width: number;
  model: ModelRenderInfo | null;
  gridOn: boolean;
  onCommitStroke: (stroke: Stroke) => void;
  onEraseStrokes: (strokes: Stroke[]) => void;
  onFitRequest?: number; // incrémenté pour recentrer
};

export default function DrawingSurface({
  docWidth,
  docHeight,
  strokes,
  strokesVersion,
  cameraRef,
  cameraVersion,
  onCameraChange,
  tool,
  color,
  width,
  model,
  gridOn,
  onCommitStroke,
  onEraseStrokes,
  onFitRequest,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const staticRef = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef<HTMLCanvasElement>(null);

  /* ---------- État d'interaction (refs : jamais de setState par point) ---------- */

  type Interaction =
    | { kind: 'none' }
    | { kind: 'draw'; pointerId: number; stroke: Stroke }
    | { kind: 'erase'; pointerId: number; erased: Stroke[] }
    | { kind: 'pan'; pointerId: number; lastX: number; lastY: number }
    | {
        kind: 'pinch';
        pointerA: number;
        pointerB: number;
        startDist: number;
        startScale: number;
        startMid: { x: number; y: number };
        startOffset: { x: number; y: number };
      };

  const interaction = useRef<Interaction>({ kind: 'none' });
  const activePointers = useRef(new Map<number, { type: string; x: number; y: number }>());
  /** Traits masqués pendant le geste de gomme en cours. */
  const eraseHidden = useRef(new Set<string>());
  const penSeen = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const staticDirty = useRef(true);
  const lastPointerScreen = useRef<{ x: number; y: number } | undefined>(undefined);

  /* ---------- Rendu ---------- */

  const renderStatic = useCallback(() => {
    const canvas = staticRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w, h, dpr } = sizeRef.current;
    const visible =
      eraseHidden.current.size === 0
        ? strokes
        : strokes.filter((s) => !eraseHidden.current.has(s.id));
    renderScene(ctx, {
      docWidth,
      docHeight,
      strokes: visible,
      model,
      camera: cameraRef.current,
      viewWidth: w,
      viewHeight: h,
      dpr,
      background: 'paper',
    });
  }, [docWidth, docHeight, model, strokes, cameraRef]);

  const renderLive = useCallback(
    (screenPos?: { x: number; y: number }) => {
      const canvas = liveRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { w, h, dpr } = sizeRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const it = interaction.current;
      if (it.kind === 'draw') {
        drawStroke(ctx, it.stroke, cameraRef.current, dpr);
      }
      if (gridOn) {
        drawGrid(ctx, cameraRef.current, w, h, dpr);
      }
      if (tool === 'eraser' && screenPos && it.kind !== 'pinch' && it.kind !== 'pan') {
        drawEraserCursor(ctx, screenPos.x, screenPos.y, ERASER_SCREEN_RADIUS, dpr);
      }
    },
    [cameraRef, gridOn, tool],
  );

  // Boucle de rendu à la demande (requestAnimationFrame).
  const rafRef = useRef(0);
  const requestRender = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      if (staticDirty.current) {
        staticDirty.current = false;
        renderStatic();
      }
      renderLive(lastPointerScreen.current);
    });
  }, [renderStatic, renderLive]);

  useEffect(() => {
    staticDirty.current = true;
    requestRender();
  }, [strokesVersion, cameraVersion, model, requestRender]);

  useEffect(() => {
    requestRender();
  }, [requestRender, gridOn, tool]);

  /* ---------- Dimensionnement (orientation, barre d'outils Safari…) ---------- */

  const resize = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    sizeRef.current = { w, h, dpr };
    for (const c of [staticRef.current, liveRef.current]) {
      if (!c) continue;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
    }
    staticDirty.current = true;
    requestRender();
  }, [requestRender]);

  useLayoutEffect(() => {
    resize();
    const observer = new ResizeObserver(() => resize());
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, [resize]);

  // Cadrage initial et « Remettre à l'écran ».
  useEffect(() => {
    const { w, h } = sizeRef.current;
    if (w > 0 && h > 0) {
      cameraRef.current = fitCamera(docWidth, docHeight, w, h);
      staticDirty.current = true;
      requestRender();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docWidth, docHeight, onFitRequest]);

  // Empêche Safari iPad de zoomer la page pendant le tracé (§6.3).
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', stop, { passive: false });
    return () => document.removeEventListener('gesturestart', stop);
  }, []);

  /* ---------- Entrées pointeur ---------- */

  const pinchData = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return {
      dist: Math.hypot(dx, dy),
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  };

  const cancelCurrentStroke = () => {
    // Abandonne le trait en cours SANS le valider (ex. paume, arrivée du stylet).
    interaction.current = { kind: 'none' };
    staticDirty.current = true;
    requestRender();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    canvas.setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, {
      type: e.pointerType,
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    });
    if (e.pointerType === 'pen') penSeen.current = true;

    const touches = [...activePointers.current.entries()].filter(
      ([, p]) => p.type === 'touch',
    );
    const it = interaction.current;

    // Un stylet actif ignore tout contact tactile (rejet de paume).
    if (
      it.kind === 'draw' &&
      it.pointerId !== e.pointerId &&
      e.pointerType === 'touch' &&
      activePointers.current.get(it.pointerId)?.type === 'pen'
    ) {
      return;
    }
    // Arrivée d'un stylet pendant un tracé au doigt : le stylet prend la main.
    if (it.kind === 'draw' && e.pointerType === 'pen' && it.pointerId !== e.pointerId) {
      cancelCurrentStroke();
    }

    // Pincement à deux doigts : zoom + déplacement.
    if (
      e.pointerType === 'touch' &&
      touches.length === 2 &&
      interaction.current.kind !== 'pinch'
    ) {
      cancelCurrentStroke();
      const [pa, pb] = touches.map(([id, p]) => ({ id, ...p }));
      const { dist, mid } = pinchData(pa, pb);
      interaction.current = {
        kind: 'pinch',
        pointerA: pa.id,
        pointerB: pb.id,
        startDist: dist,
        startScale: cameraRef.current.scale,
        startMid: mid,
        startOffset: {
          x: cameraRef.current.offsetX,
          y: cameraRef.current.offsetY,
        },
      };
      return;
    }

    if (interaction.current.kind !== 'none') return;

    switch (tool) {
      case 'pan': {
        interaction.current = {
          kind: 'pan',
          pointerId: e.pointerId,
          lastX: e.nativeEvent.offsetX,
          lastY: e.nativeEvent.offsetY,
        };
        break;
      }
      case 'eraser': {
        eraseHidden.current = new Set();
        interaction.current = { kind: 'erase', pointerId: e.pointerId, erased: [] };
        applyErase(e);
        break;
      }
      case 'pen': {
        // Après avoir vu un stylet, le doigt ne dessine plus (paume) ;
        // comportement réinitialisé à chaque visite de l'atelier.
        if (e.pointerType === 'touch' && penSeen.current) return;
        const point = eventToStrokePoint(
          e.nativeEvent,
          (x, y) => screenToDoc({ x, y }, cameraRef.current),
        );
        interaction.current = {
          kind: 'draw',
          pointerId: e.pointerId,
          stroke: createStroke(color, width, point),
        };
        requestRender();
        break;
      }
    }
  };

  const applyErase = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = screenToDoc({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }, cameraRef.current);
    const radius = ERASER_SCREEN_RADIUS / cameraRef.current.scale;
    const newlyHit = strokes.filter(
      (s) =>
        !eraseHidden.current.has(s.id) && hitTestStroke(s, p, radius),
    );
    if (newlyHit.length > 0) {
      const it = interaction.current;
      if (it.kind === 'erase') {
        it.erased.push(...newlyHit);
        for (const s of newlyHit) eraseHidden.current.add(s.id);
        staticDirty.current = true;
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    lastPointerScreen.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    const info = activePointers.current.get(e.pointerId);
    if (info) {
      info.x = e.nativeEvent.offsetX;
      info.y = e.nativeEvent.offsetY;
    }
    const it = interaction.current;

    if (it.kind === 'pinch') {
      const a = activePointers.current.get(it.pointerA);
      const b = activePointers.current.get(it.pointerB);
      if (a && b) {
        const { dist, mid } = pinchData(a, b);
        if (it.startDist > 10) {
          const scale = Math.min(
            12,
            Math.max(0.1, (it.startScale * dist) / it.startDist),
          );
          const midShift = { x: mid.x - it.startMid.x, y: mid.y - it.startMid.y };
          // Le point de départ du pincement reste sous les doigts.
          const anchor = it.startMid;
          const zoomed = zoomAroundPoint(
            {
              scale: it.startScale,
              offsetX: it.startOffset.x,
              offsetY: it.startOffset.y,
            },
            scale / it.startScale,
            anchor,
          );
          cameraRef.current = panCamera(zoomed, midShift.x, midShift.y);
          staticDirty.current = true;
        }
      }
      requestRender();
      return;
    }

    if (it.kind === 'pan' && it.pointerId === e.pointerId) {
      const dx = e.nativeEvent.offsetX - it.lastX;
      const dy = e.nativeEvent.offsetY - it.lastY;
      it.lastX = e.nativeEvent.offsetX;
      it.lastY = e.nativeEvent.offsetY;
      onCameraChange((c) => panCamera(c, dx, dy));
      return;
    }

    if (it.kind === 'draw' && it.pointerId === e.pointerId) {
      for (const ev of coalescedEvents(e.nativeEvent)) {
        const point = eventToStrokePoint(ev, (x, y) =>
          screenToDoc({ x, y }, cameraRef.current),
        );
        appendPoint(it.stroke, point);
      }
      requestRender();
      return;
    }

    if (it.kind === 'erase' && it.pointerId === e.pointerId) {
      applyErase(e);
      requestRender();
      return;
    }

    // Curseur de gomme au survol (souris).
    if (tool === 'eraser' && e.pointerType === 'mouse') {
      requestRender();
    }
  };

  const finishPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointers.current.delete(e.pointerId);
    const it = interaction.current;

    if (it.kind === 'pinch') {
      const a = activePointers.current.get(it.pointerA);
      const b = activePointers.current.get(it.pointerB);
      if (!a || !b) {
        interaction.current = { kind: 'none' };
        requestRender();
      }
      return;
    }

    if (it.kind === 'none' || it.pointerId !== e.pointerId) return;

    if (it.kind === 'draw') {
      if (it.stroke.points.length > 0) {
        onCommitStroke(it.stroke);
      }
    } else if (it.kind === 'erase') {
      if (it.erased.length > 0) {
        onEraseStrokes(it.erased);
      }
      eraseHidden.current = new Set();
      staticDirty.current = true;
    }
    interaction.current = { kind: 'none' };
    requestRender();
  };

  const onPointerLeave = () => {
    lastPointerScreen.current = undefined;
    if (tool === 'eraser') requestRender();
  };

  /* ---------- Molette / trackpad (desktop) ---------- */

  useEffect(() => {
    const canvas = liveRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const anchor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * 0.01);
        onCameraChange((c) => zoomAroundPoint(c, factor, anchor));
      } else {
        onCameraChange((c) => panCamera(c, -e.deltaX, -e.deltaY));
      }
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [onCameraChange]);

  return (
    <div
      ref={wrapRef}
      className="canvas-wrap"
      // Le positionnement (absolute inset 0) vient de workshop.css : un
      // style inline position:relative écraserait la règle et le conteneur
      // aurait une hauteur nulle (canvases enfants en absolu).
      style={{ overflow: 'hidden', touchAction: 'none' }}
    >
      <canvas
        ref={staticRef}
        style={{ position: 'absolute', inset: 0 }}
      />
      <canvas
        ref={liveRef}
        style={{ position: 'absolute', inset: 0 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onPointerLeave={onPointerLeave}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
