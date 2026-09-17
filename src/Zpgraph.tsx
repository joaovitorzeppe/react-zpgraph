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
import {
  createExtrasController,
  type ExtrasController,
  type ExtrasProps,
} from "./extras-bridge";
import {
  disposeDynamicLabelHosts,
  paintDynamicLabels,
  type DynamicLabelRenders,
} from "./dynamic-labels";
import { createReactHost, resolveNode, type ReactHost } from "./react-host";
import type { LabelRender, ZpgraphHandle, ZpgraphProps } from "./types";
import type { SpanBand } from "zpgraph/extras/span-bands";

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

const pickExtras = (props: ZpgraphProps): ExtrasProps => {
  const out: ExtrasProps = {};
  if (props.zoomLimits !== undefined) out.zoomLimits = props.zoomLimits;
  if (props.keyboard !== undefined) out.keyboard = props.keyboard;
  if (props.measure !== undefined) out.measure = props.measure;
  if (props.onMeasure !== undefined) out.onMeasure = props.onMeasure;
  if (props.brushSelect !== undefined) out.brushSelect = props.brushSelect;
  if (props.brushActive !== undefined) out.brushActive = props.brushActive;
  if (props.onBrushSelect !== undefined)
    out.onBrushSelect = props.onBrushSelect;
  if (props.urlSync !== undefined) out.urlSync = props.urlSync;
  if (props.locale !== undefined) out.locale = props.locale;
  if (props.spanBands !== undefined) out.spanBands = props.spanBands;
  if (props.movingAverage !== undefined)
    out.movingAverage = props.movingAverage;
  if (props.fillBetween !== undefined) out.fillBetween = props.fillBetween;
  return out;
};
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
    labels: Partial<Record<(typeof LABEL_SLOTS)[number]["key"], ReactHost>>;
    overlays: Partial<Record<(typeof OVERLAY_SLOTS)[number]["key"], ReactHost>>;
  },
  dynamic?: {
    renders: DynamicLabelRenders;
    hosts: {
      threshold: ReactHost[];
      spanBand: ReactHost[];
      measure: ReactHost | null;
    };
    thresholds?: ThresholdBand[] | undefined;
    spanBands?: SpanBand[] | undefined;
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
  const hasDynamic =
    !!dynamic?.renders.renderThresholdLabel ||
    !!dynamic?.renders.renderSpanBandLabel ||
    !!dynamic?.renders.renderMeasureLabel;

  if (
    !theme &&
    !classNames &&
    options === undefined &&
    !hasSlots &&
    !hasDynamic
  ) {
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
    OVERLAY_SLOTS.some(({ key }) => slots[key]) ||
    hasDynamic;

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

      if (dynamic && hasDynamic) {
        paintDynamicLabels(
          g.graphDiv,
          dynamic.renders,
          dynamic.hosts,
          dynamic.thresholds,
          dynamic.spanBands,
        );
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
 * Extras plugins attach on first mount from props (see ExtrasProps).
 */
export const Zpgraph = forwardRef<ZpgraphHandle, ZpgraphProps>(
  function Zpgraph(props, ref) {
    const {
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
      renderThresholdLabel,
      renderSpanBandLabel,
      renderMeasureLabel,
      onZoom,
      onPointClick,
    } = props;

    const legendRender = renderLegend ?? renderTooltip;
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<ZpgraphCore | null>(null);
    const extrasRef = useRef<ExtrasController | null>(null);
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
    const extrasPropsRef = useRef(pickExtras(props));
    extrasPropsRef.current = pickExtras(props);

    const renderLegendRef = useRef(legendRender);
    const renderTitleRef = useRef(renderTitle);
    const renderXLabelRef = useRef(renderXLabel);
    const renderYLabelRef = useRef(renderYLabel);
    const renderY2LabelRef = useRef(renderY2Label);
    const renderNoDataRef = useRef(renderNoData);
    const renderToolbarRef = useRef(renderToolbar);
    const dynamicRendersRef = useRef<DynamicLabelRenders>({
      renderThresholdLabel,
      renderSpanBandLabel,
      renderMeasureLabel,
    });
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;

    const legendHostRef = useRef<ReactHost | null>(null);
    const labelHostsRef = useRef<
      Partial<Record<(typeof LABEL_SLOTS)[number]["key"], ReactHost>>
    >({});
    const overlayHostsRef = useRef<
      Partial<Record<(typeof OVERLAY_SLOTS)[number]["key"], ReactHost>>
    >({});
    const dynamicHostsRef = useRef<{
      threshold: ReactHost[];
      spanBand: ReactHost[];
      measure: ReactHost | null;
    }>({
      threshold: [],
      spanBand: [],
      measure: null,
    });

    const currentSlots = (): RenderSlots => ({
      renderLegend: renderLegendRef.current,
      renderTitle: renderTitleRef.current,
      renderXLabel: renderXLabelRef.current,
      renderYLabel: renderYLabelRef.current,
      renderY2Label: renderY2LabelRef.current,
      renderNoData: renderNoDataRef.current,
      renderToolbar: renderToolbarRef.current,
    });

    const resolveSpanBands = (): SpanBand[] | undefined => {
      const raw = extrasPropsRef.current.spanBands;
      if (!raw) return undefined;
      return Array.isArray(raw) ? raw : raw.bands;
    };

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
        {
          renders: dynamicRendersRef.current,
          hosts: dynamicHostsRef.current,
          thresholds: shortcutsRef.current.thresholds,
          spanBands: resolveSpanBands(),
        },
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
      setBrushActive: (active) => {
        extrasRef.current?.setBrushActive(active);
      },
      clearMeasure: () => {
        extrasRef.current?.clearMeasure();
      },
    }));

    useLayoutEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      if (renderLegendRef.current && !legendHostRef.current) {
        legendHostRef.current = createReactHost();
      }

      const extras = createExtrasController(extrasPropsRef.current);
      extrasRef.current = extras;

      const base = buildOptions(optionsRef.current, currentSlots());
      const withExtras = extras.mergeIntoOptions(base);

      const g = new ZpgraphCore(el, dataRef.current, withExtras);
      instanceRef.current = g;
      extras.afterMount(g);
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
        extras.destroy();
        if (extrasRef.current === extras) {
          extrasRef.current = null;
        }
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
        disposeDynamicLabelHosts(dynamicHostsRef.current);
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
        renderToolbarRef.current !== renderToolbar ||
        dynamicRendersRef.current.renderThresholdLabel !==
          renderThresholdLabel ||
        dynamicRendersRef.current.renderSpanBandLabel !==
          renderSpanBandLabel ||
        dynamicRendersRef.current.renderMeasureLabel !== renderMeasureLabel;

      if (
        !themeChanged &&
        !optionsChanged &&
        !classNamesChanged &&
        !shortcutsChanged &&
        !slotsChanged
      ) {
        // Still sync extras (locale / brush / bands / callbacks).
        extrasRef.current?.sync(extrasPropsRef.current, instanceRef.current);
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
      dynamicRendersRef.current = {
        renderThresholdLabel,
        renderSpanBandLabel,
        renderMeasureLabel,
      };

      if (legendRender && !legendHostRef.current) {
        legendHostRef.current = createReactHost();
      }

      const merged = buildOptions(options, currentSlots());
      if (merged !== undefined) {
        instanceRef.current?.updateOptions(merged);
      }
      extrasRef.current?.sync(extrasPropsRef.current, instanceRef.current);
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
      renderThresholdLabel,
      renderSpanBandLabel,
      renderMeasureLabel,
      onZoom,
      onPointClick,
      props.zoomLimits,
      props.keyboard,
      props.measure,
      props.onMeasure,
      props.brushSelect,
      props.brushActive,
      props.onBrushSelect,
      props.urlSync,
      props.locale,
      props.spanBands,
      props.movingAverage,
      props.fillBetween,
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
