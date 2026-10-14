import { useCallback, useEffect, useRef } from 'react';
import type { Stroke } from '../types';
import {
  renderScene,
  type ModelRenderInfo,
} from '../engine/render';
import { sharedFitCamera } from '../engine/coordinates';

/**
 * Mode Côte à côte (§6.6) : l'original d'un côté, le dessin seul de l'autre,
 * à la MÊME échelle des deux côtés, sans déformation. En portrait, les deux
 * vues sont empilées verticalement (CSS).
 */

type Props = {
  docWidth: number;
  docHeight: number;
  strokes: readonly Stroke[];
  model: ModelRenderInfo | null;
};

export default function ComparisonView({
  docWidth,
  docHeight,
  strokes,
  model,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(() => {
    const wrap = wrapRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!wrap || !left || !right) return;
    const children = [...wrap.querySelectorAll<HTMLElement>('.compare-pane')];
    const leftPane = children[0];
    const rightPane = children[1];
    if (!leftPane || !rightPane) return;
    const lw = leftPane.clientWidth;
    const lh = leftPane.clientHeight;
    const rw = rightPane.clientWidth;
    const rh = rightPane.clientHeight;
    if (lw < 4 || lh < 4 || rw < 4 || rh < 4) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const { left: leftCam, right: rightCam } = sharedFitCamera(
      docWidth,
      docHeight,
      lw,
      lh,
      rw,
      rh,
    );

    left.width = Math.round(lw * dpr);
    left.height = Math.round(lh * dpr);
    left.style.width = `${lw}px`;
    left.style.height = `${lh}px`;
    right.width = Math.round(rw * dpr);
    right.height = Math.round(rh * dpr);
    right.style.width = `${rw}px`;
    right.style.height = `${rh}px`;

    const leftCtx = left.getContext('2d');
    const rightCtx = right.getContext('2d');
    if (leftCtx) {
      renderScene(leftCtx, {
        docWidth,
        docHeight,
        strokes: [],
        model: model && model.visible ? model : null,
        camera: leftCam,
        viewWidth: lw,
        viewHeight: lh,
        dpr,
        background: 'white',
      });
    }
    if (rightCtx) {
      renderScene(rightCtx, {
        docWidth,
        docHeight,
        strokes,
        model: null,
        camera: rightCam,
        viewWidth: rw,
        viewHeight: rh,
        dpr,
        background: 'white',
      });
    }
  }, [docWidth, docHeight, model, strokes]);

  useEffect(() => {
    render();
    const observer = new ResizeObserver(() => render());
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, [render]);

  const hasModel = model !== null;

  return (
    <div className="compare-wrap" ref={wrapRef}>
      <div className="compare-pane">
        <div className="compare-label">Modèle original</div>
        {hasModel ? (
          <canvas ref={leftRef} />
        ) : (
          <p className="faint">Aucun modèle — page blanche.</p>
        )}
      </div>
      <div className="compare-pane">
        <div className="compare-label">Mon dessin</div>
        <canvas ref={rightRef} />
      </div>
    </div>
  );
}
