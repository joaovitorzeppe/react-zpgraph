/**
 * @license
 * Copyright (c) 2026 João Vitor Zeppe (zeppejoaovitor@gmail.com)
 * MIT-licensed: https://opensource.org/license/MIT
 */

import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import ZpgraphCore, { themes } from "zpgraph";
import type {
  ChartAnnotations,
  ChartClassNames,
  ChartTheme,
  LegendData,
  ThresholdBand,
  ToolbarOptions,
  ZpgraphOptions,
} from "zpgraph";
import type ZpgraphInstance from "zpgraph";
import { createReactHost, resolveNode, type ReactHost } from "./react-host";
import type { LabelRender, ZpgraphHandle, ZpgraphProps } from "./types";

type RenderSlots = {
  renderLegend?: ZpgraphProps["renderLegend"];
  renderTitle?: LabelRender;
  renderXLabel?: LabelRender;
  renderYLabel?: LabelRender;
  renderY2Label?: LabelRender;
  renderNoData?: LabelRender;
  renderToolbar?: LabelRender;
};

const LABEL_SLOTS: Array<{
  key: keyof Omit<
    RenderSlots,
    "renderLegend" | "renderNoData" | "renderToolbar"
  >;
  selector: string;
}> = [
  { key: "renderTitle", selector: ".zpgraph-title" },
  { key: "renderXLabel", selector: ".zpgraph-xlabel" },
  { key: "renderYLabel", selector: ".zpgraph-ylabel" },
  { key: "renderY2Label", selector: ".zpgraph-y2label" },
];

const OVERLAY_SLOTS: Array<{
  key: "renderNoData" | "renderToolbar";
  selector: string;
}> = [
  { key: "renderNoData", selector: ".zpgraph-no-data" },
  { key: "renderToolbar", selector: ".zpgraph-toolbar" },
];

const mergeShortcutOptions = (
  options: Partial<ZpgraphOptions> | undefined,
  shortcuts: {
    loading?: boolean | undefined;
    toolbar?: boolean | ToolbarOptions | undefined;
    thresholds?: ThresholdBand[] | undefined;
    chartAnnotations?: ChartAnnotations | undefined;
    onZoom?: ZpgraphProps["onZoom"] | undefined;
    onPointClick?: ZpgraphProps["onPointClick"] | undefined;
  },
): Partial<ZpgraphOptions> => {
  const merged: Partial<ZpgraphOptions> = { ...options };
  if (shortcuts.loading != null) merged.loading = shortcuts.loading;
  if (shortcuts.toolbar != null) merged.toolbar = shortcuts.toolbar;
  if (shortcuts.thresholds != null) merged.thresholds = shortcuts.thresholds;
  if (shortcuts.chartAnnotations != null) {
    merged.chartAnnotations = shortcuts.chartAnnotations;
  }
  if (shortcuts.onZoom) {
    const userZoom = options?.zoomCallback;
    merged.zoomCallback = (min, max, ranges) => {
      shortcuts.onZoom?.(min, max, ranges);
      userZoom?.(min, max, ranges);
    };
  }
  if (shortcuts.onPointClick) {
    const userClick = options?.pointClickCallback;
    merged.pointClickCallback = (event, point) => {
      shortcuts.onPointClick?.(event, point);
      userClick?.(event, point);
    };
  }
  return merged;
};

const mergeOptions = (
  theme: ChartTheme | undefined,
  classNames: ChartClassNames | undefined,
  options: Partial<ZpgraphOptions> | undefined,
  slots: RenderSlots,
  hosts: {
    legend?: ReactHost | undefined;
    labels: Partial<
      Record<(typeof LABEL_SLOTS)[number]["key"], ReactHost>
    >;
    overlays: Partial<Record<(typeof OVERLAY_SLOTS)[number]["key"], ReactHost>>;
  },
): Partial<ZpgraphOptions> | undefined => {
  const hasSlots =
    !!slots.renderLegend ||
    !!slots.renderTitle ||
    !!slots.renderXLabel ||
    !!slots.renderYLabel ||
    !!slots.renderY2Label ||
    !!slots.renderNoData ||
    !!slots.renderToolbar;

  if (!theme && !classNames && options === undefined && !hasSlots) {
    return undefined;
  }

  const merged: Partial<ZpgraphOptions> = { ...options };
  if (classNames) {
    merged.classNames = { ...options?.classNames, ...classNames };
  }

  if (slots.renderLegend && hosts.legend) {
    const host = hosts.legend;
    const renderLegend = slots.renderLegend;
    merged.legendFormatter = (data: LegendData) => {
      host.render(renderLegend(data));
      return host.element;
    };
  }

  const needsPortal =
    LABEL_SLOTS.some(({ key }) => slots[key]) ||
    OVERLAY_SLOTS.some(({ key }) => slots[key]);

  if (needsPortal) {
    const userDraw = options?.drawCallback;
    merged.drawCallback = (g: ZpgraphInstance, isInitial: boolean) => {
      for (const { key, selector } of LABEL_SLOTS) {
        const slot = slots[key];
        if (!slot) continue;
        const target = g.graphDiv.querySelector(selector);
        if (!target) continue;

        let host = hosts.labels[key];
        if (!host) {
          host = createReactHost();
          hosts.labels[key] = host;
        }
        if (host.element.parentElement !== target) {
          target.replaceChildren(host.element);
        }
        const node = resolveNode(slot);
        if (node !== undefined) host.render(node);
      }

      for (const { key, selector } of OVERLAY_SLOTS) {
        const slot = slots[key];
        if (!slot) continue;
        const target = g.graphDiv.querySelector(selector);
        if (!target) continue;
        let host = hosts.overlays[key];
        if (!host) {
          host = createReactHost();
          hosts.overlays[key] = host;
        }
        if (host.element.parentElement !== target) {
          target.replaceChildren(host.element);
        }
        const node = resolveNode(slot);
        if (node !== undefined) host.render(node);
      }

      userDraw?.(g, isInitial);
    };
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
    {
      data,
      options,
      theme,
      classNames,
      className,
      style,
      onReady,
      loading,
      toolbar,
      thresholds,
      chartAnnotations,
      renderLegend,
      renderTooltip,
      renderNoData,
      renderToolbar,
      renderTitle,
      renderXLabel,
      renderYLabel,
      renderY2Label,
      onZoom,
      onPointClick,
    },
    ref,
  ) {
    const legendRender = renderLegend ?? renderTooltip;
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<ZpgraphCore | null>(null);
    const dataRef = useRef(data);
    const optionsRef = useRef(options);
    const themeRef = useRef(theme);
    const classNamesRef = useRef(classNames);
    const shortcutsRef = useRef({
      loading,
      toolbar,
      thresholds,
      chartAnnotations,
      onZoom,
      onPointClick,
    });
    const renderLegendRef = useRef(legendRender);
    const renderTitleRef = useRef(renderTitle);
    const renderXLabelRef = useRef(renderXLabel);
    const renderYLabelRef = useRef(renderYLabel);
    const renderY2LabelRef = useRef(renderY2Label);
    const renderNoDataRef = useRef(renderNoData);
    const renderToolbarRef = useRef(renderToolbar);
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;

    const legendHostRef = useRef<ReactHost | null>(null);
    const labelHostsRef = useRef<
      Partial<Record<(typeof LABEL_SLOTS)[number]["key"], ReactHost>>
    >({});
    const overlayHostsRef = useRef<
      Partial<Record<(typeof OVERLAY_SLOTS)[number]["key"], ReactHost>>
    >({});

    const currentSlots = (): RenderSlots => ({
      renderLegend: renderLegendRef.current,
      renderTitle: renderTitleRef.current,
      renderXLabel: renderXLabelRef.current,
      renderYLabel: renderYLabelRef.current,
      renderY2Label: renderY2LabelRef.current,
      renderNoData: renderNoDataRef.current,
      renderToolbar: renderToolbarRef.current,
    });

    const buildOptions = (
      opts: Partial<ZpgraphOptions> | undefined,
      slots: RenderSlots,
    ) => {
      const hosts = {
        labels: labelHostsRef.current,
        overlays: overlayHostsRef.current,
        legend: legendHostRef.current ?? undefined,
      };
      return mergeOptions(
        themeRef.current,
        classNamesRef.current,
        mergeShortcutOptions(opts, shortcutsRef.current),
        slots,
        hosts,
      );
    };

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
      toPng: (opts) => instanceRef.current?.toPng(opts) ?? "",
      toCsv: (opts) => instanceRef.current?.toCsv(opts) ?? "",
      resetZoom: () => {
        instanceRef.current?.resetZoom();
      },
      setAnnotations: (ann) => {
        instanceRef.current?.setAnnotations(ann);
      },
    }));

    useLayoutEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      if (renderLegendRef.current && !legendHostRef.current) {
        legendHostRef.current = createReactHost();
      }

      const g = new ZpgraphCore(
        el,
        dataRef.current,
        buildOptions(optionsRef.current, currentSlots()),
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
        legendHostRef.current?.dispose();
        legendHostRef.current = null;
        for (const host of Object.values(labelHostsRef.current)) {
          host?.dispose();
        }
        labelHostsRef.current = {};
        for (const host of Object.values(overlayHostsRef.current)) {
          host?.dispose();
        }
        overlayHostsRef.current = {};
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const shortcutsChanged =
        shortcutsRef.current.loading !== loading ||
        shortcutsRef.current.toolbar !== toolbar ||
        shortcutsRef.current.thresholds !== thresholds ||
        shortcutsRef.current.chartAnnotations !== chartAnnotations ||
        shortcutsRef.current.onZoom !== onZoom ||
        shortcutsRef.current.onPointClick !== onPointClick;
      const slotsChanged =
        renderLegendRef.current !== legendRender ||
        renderTitleRef.current !== renderTitle ||
        renderXLabelRef.current !== renderXLabel ||
        renderYLabelRef.current !== renderYLabel ||
        renderY2LabelRef.current !== renderY2Label ||
        renderNoDataRef.current !== renderNoData ||
        renderToolbarRef.current !== renderToolbar;

      if (
        !themeChanged &&
        !optionsChanged &&
        !classNamesChanged &&
        !shortcutsChanged &&
        !slotsChanged
      ) {
        return;
      }

      themeRef.current = theme;
      optionsRef.current = options;
      classNamesRef.current = classNames;
      shortcutsRef.current = {
        loading,
        toolbar,
        thresholds,
        chartAnnotations,
        onZoom,
        onPointClick,
      };
      renderLegendRef.current = legendRender;
      renderTitleRef.current = renderTitle;
      renderXLabelRef.current = renderXLabel;
      renderYLabelRef.current = renderYLabel;
      renderY2LabelRef.current = renderY2Label;
      renderNoDataRef.current = renderNoData;
      renderToolbarRef.current = renderToolbar;

      if (legendRender && !legendHostRef.current) {
        legendHostRef.current = createReactHost();
      }

      const merged = buildOptions(options, currentSlots());
      if (merged !== undefined) {
        instanceRef.current?.updateOptions(merged);
      }
    }, [
      theme,
      options,
      classNames,
      loading,
      toolbar,
      thresholds,
      chartAnnotations,
      legendRender,
      renderTitle,
      renderXLabel,
      renderYLabel,
      renderY2Label,
      renderNoData,
      renderToolbar,
      onZoom,
      onPointClick,
    ]);

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
