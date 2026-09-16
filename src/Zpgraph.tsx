import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import ZpgraphCore from "zpgraph";
import type { ZpgraphHandle, ZpgraphProps } from "./types";

/**
 * Thin React wrapper around zpgraph.
 * One ctor on mount; data/options flow through updateOptions (no recreate).
 */
export const Zpgraph = forwardRef<ZpgraphHandle, ZpgraphProps>(
  function Zpgraph({ data, options, className, style, onReady }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<ZpgraphCore | null>(null);
    const dataRef = useRef(data);
    const optionsRef = useRef(options);
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;

    useImperativeHandle(ref, () => ({
      getInstance: () => instanceRef.current,
      updateOptions: (opts, blockRedraw) => {
        instanceRef.current?.updateOptions(opts, blockRedraw);
      },
      resize: () => {
        instanceRef.current?.resize();
      },
      destroy: () => {
        instanceRef.current?.destroy();
        instanceRef.current = null;
      },
    }));

    useLayoutEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const g = new ZpgraphCore(el, dataRef.current, optionsRef.current);
      instanceRef.current = g;
      onReadyRef.current?.(g);

      let ro: ResizeObserver | undefined;
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => {
          instanceRef.current?.resize();
        });
        ro.observe(el);
      }

      return () => {
        ro?.disconnect();
        g.destroy();
        if (instanceRef.current === g) {
          instanceRef.current = null;
        }
      };
    }, []);

    useLayoutEffect(() => {
      if (dataRef.current === data) return;
      dataRef.current = data;
      instanceRef.current?.updateOptions({ file: data });
    }, [data]);

    useLayoutEffect(() => {
      if (optionsRef.current === options) return;
      optionsRef.current = options;
      if (options !== undefined) {
        instanceRef.current?.updateOptions(options);
      }
    }, [options]);

    return <div ref={containerRef} className={className} style={style} />;
  },
);
