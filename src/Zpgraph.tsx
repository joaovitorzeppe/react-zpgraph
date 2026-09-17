import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import ZpgraphCore, { themes } from "zpgraph";
import type { ChartClassNames, ChartTheme, ZpgraphOptions } from "zpgraph";
import type { ZpgraphHandle, ZpgraphProps } from "./types";

const mergeOptions = (
  theme: ChartTheme | undefined,
  classNames: ChartClassNames | undefined,
  options: Partial<ZpgraphOptions> | undefined,
): Partial<ZpgraphOptions> | undefined => {
  if (!theme && !classNames && options === undefined) return undefined;
  const merged: Partial<ZpgraphOptions> = { ...options };
  if (classNames) {
    merged.classNames = { ...options?.classNames, ...classNames };
  }
  if (!theme) return merged;
  return { ...themes[theme], ...merged, theme };
};

/**
 * Thin React wrapper around zpgraph.
 * One ctor on mount; data/options/theme flow through updateOptions (no recreate).
 */
export const Zpgraph = forwardRef<ZpgraphHandle, ZpgraphProps>(
  function Zpgraph(
    { data, options, theme, classNames, className, style, onReady },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<ZpgraphCore | null>(null);
    const dataRef = useRef(data);
    const optionsRef = useRef(options);
    const themeRef = useRef(theme);
    const classNamesRef = useRef(classNames);
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

      const g = new ZpgraphCore(
        el,
        dataRef.current,
        mergeOptions(
          themeRef.current,
          classNamesRef.current,
          optionsRef.current,
        ),
      );
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
      const themeChanged = themeRef.current !== theme;
      const optionsChanged = optionsRef.current !== options;
      const classNamesChanged = classNamesRef.current !== classNames;
      if (!themeChanged && !optionsChanged && !classNamesChanged) return;
      themeRef.current = theme;
      optionsRef.current = options;
      classNamesRef.current = classNames;
      const merged = mergeOptions(theme, classNames, options);
      if (merged !== undefined) {
        instanceRef.current?.updateOptions(merged);
      }
    }, [theme, options, classNames]);

    return (
      <div
        ref={containerRef}
        className={className}
        style={style}
        {...(theme ? { "data-theme": theme } : {})}
      />
    );
  },
);
