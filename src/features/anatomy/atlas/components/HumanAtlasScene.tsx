import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import type {
  AtlasManifest,
  AtlasSceneState,
  HumanAtlasViewerHandle,
} from '../types';
import { mountAtlasRuntime, type AtlasRuntime } from '../engine/runtime';

type Props = {
  atlas: AtlasManifest;
  state: AtlasSceneState;
  onSelect(partId: string): void;
  onProgress(percent: number): void;
  onReady(): void;
  onError(message: string): void;
};

const HumanAtlasScene = forwardRef<HumanAtlasViewerHandle, Props>(
  function HumanAtlasScene(props, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const runtimeRef = useRef<AtlasRuntime | null>(null);
    const stateRef = useRef(props.state);
    const callbacksRef = useRef(props);
    stateRef.current = props.state;
    callbacksRef.current = props;

    useImperativeHandle(ref, () => ({
      exportSnapshot: async () => {
        if (!runtimeRef.current) throw new Error('Le moteur 3D n’est pas prêt.');
        return runtimeRef.current.capture();
      },
    }), []);

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;
      let runtime: AtlasRuntime;
      try {
        runtime = mountAtlasRuntime({
          host,
          atlas: props.atlas,
          state: stateRef,
          onSelect: (id) => callbacksRef.current.onSelect(id),
          onProgress: (value) => callbacksRef.current.onProgress(value),
          onReady: () => callbacksRef.current.onReady(),
          onError: (message) => callbacksRef.current.onError(message),
        });
        runtimeRef.current = runtime;
      } catch {
        callbacksRef.current.onError(
          'Ce navigateur ne peut pas démarrer le visualiseur 3D. Vérifiez que WebGL est activé.',
        );
        return;
      }
      return () => {
        runtime.dispose();
        runtimeRef.current = null;
      };
    }, [props.atlas]);

    return <div className="human-atlas-scene" ref={hostRef} />;
  },
);

export default HumanAtlasScene;
