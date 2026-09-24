/**
 * @license
 * Copyright (c) 2026 João Vitor Zeppe (zeppejoaovitor@gmail.com)
 * MIT-licensed: https://opensource.org/license/MIT
 */

import { Zpgraph as ZpgraphCore, type Plugin, type Plotter, type ZpgraphOptions, type Zpgraph } from "zpgraph";

import ZoomLimits, { type ZoomLimitsOptions } from "zpgraph/extras/zoom-limits";
import Keyboard, { type KeyboardOptions } from "zpgraph/extras/keyboard";
import Measure, {
  type MeasureOptions,
  type MeasureResult,
} from "zpgraph/extras/measure";
import BrushSelect, {
  type BrushSelectOptions,
  type BrushSelectResult,
} from "zpgraph/extras/brush-select";
import UrlSync, { type UrlSyncOptions } from "zpgraph/extras/url-sync";
import { applyLocale, packs, type LocalePack } from "zpgraph/extras/locale";
import SpanBands, {
  type SpanBand,
  type SpanBandsOptions,
} from "zpgraph/extras/span-bands";
import {
  createMovingAveragePlotter,
  type MovingAverageOptions,
} from "zpgraph/extras/moving-average";
import {
  createFillBetweenPlotter,
  type FillBetweenOptions,
} from "zpgraph/extras/fill-between";

export type LocaleProp = LocalePack | keyof typeof packs;

export type ExtrasProps = {
  zoomLimits?: boolean | ZoomLimitsOptions;
  keyboard?: boolean | KeyboardOptions;
  /** `true` / options, or omit and use `onMeasure` alone to enable. */
  measure?: boolean | MeasureOptions;
  onMeasure?: (result: MeasureResult) => void;
  brushSelect?: boolean | Omit<BrushSelectOptions, "onSelect" | "active">;
  brushActive?: boolean;
  onBrushSelect?: (result: BrushSelectResult) => void;
  urlSync?: boolean | UrlSyncOptions;
  locale?: LocaleProp;
  spanBands?: SpanBand[] | SpanBandsOptions;
  movingAverage?: boolean | MovingAverageOptions;
  fillBetween?: FillBetweenOptions;
};

export type ExtrasController = {
  mergeIntoOptions: (
    opts: Partial<ZpgraphOptions> | undefined,
  ) => Partial<ZpgraphOptions> | undefined;
  afterMount: (g: Zpgraph) => void;
  sync: (props: ExtrasProps, g: Zpgraph | null) => void;
  destroy: () => void;
  setBrushActive: (active: boolean) => void;
  clearMeasure: () => void;
};

type LocaleTarget = Parameters<typeof applyLocale>[0];

const isLocaleTarget = (g: unknown): g is LocaleTarget =>
  typeof g === "object" && g !== null;

const isPlotter = (v: unknown): v is Plotter => typeof v === "function";

const hasAddPlugins = (
  g: object,
): g is { addPlugins: (extra: unknown[]) => void } =>
  "addPlugins" in g && typeof g.addPlugins === "function";

const resolveLocale = (locale: LocaleProp | undefined): LocalePack | null => {
  if (locale == null) {
    return null;
  }
  if (typeof locale === "string") {
    return packs[locale] ?? null;
  }
  return locale;
};

const asOpts = <T extends object>(
  value: boolean | T | undefined,
): Partial<T> | null => {
  if (value === true) {
    return {};
  }
  if (value && typeof value === "object") {
    return value;
  }
  return null;
};

const normalizePlotters = (
  plotter: ZpgraphOptions["plotter"],
): Plotter[] | null => {
  if (!plotter) {
    return null;
  }
  return Array.isArray(plotter) ? [...plotter] : [plotter];
};

const defaultPlotters = (): Plotter[] | null => {
  const P = ZpgraphCore.Plotters;
  if (!P?.fillPlotter || !P?.linePlotter || !P?.errorPlotter) {
    return null;
  }
  const list = [P.fillPlotter, P.errorPlotter, P.linePlotter];
  if (!list.every(isPlotter)) {
    return null;
  }
  return list;
};

const buildPlotters = (
  user: ZpgraphOptions["plotter"],
  props: ExtrasProps,
): Plotter[] | null => {
  const maOpts = asOpts<MovingAverageOptions>(props.movingAverage);
  const fbOpts = props.fillBetween ?? null;
  if (!maOpts && !fbOpts) {
    return null;
  }

  let list = normalizePlotters(user) ?? defaultPlotters();
  if (!list) {
    return null;
  }

  if (fbOpts) {
    list = [createFillBetweenPlotter(fbOpts), ...list];
  }
  if (maOpts) {
    list = [...list, createMovingAveragePlotter(maOpts)];
  }
  return list;
};

const spanOptions = (
  value: ExtrasProps["spanBands"],
): SpanBandsOptions | null => {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return { bands: value };
  }
  return value;
};

/**
 * Owns plugin instances for React props. Plugins attach on first chart ctor;
 * sync() updates mutable bits (locale, brush, bands, callbacks, plotters).
 */
export const createExtrasController = (
  initial: ExtrasProps,
): ExtrasController => {
  const plugins: Plugin[] = [];
  let zoomLimits: InstanceType<typeof ZoomLimits> | null = null;
  let keyboard: InstanceType<typeof Keyboard> | null = null;
  let measure: InstanceType<typeof Measure> | null = null;
  let brush: InstanceType<typeof BrushSelect> | null = null;
  let urlSync: InstanceType<typeof UrlSync> | null = null;
  let spanBands: InstanceType<typeof SpanBands> | null = null;

  let onMeasureRef = initial.onMeasure;
  let onBrushRef = initial.onBrushSelect;
  let lastPlotterKey = "";
  let userPlotter: ZpgraphOptions["plotter"] | undefined;

  const zlOpts = asOpts<ZoomLimitsOptions>(initial.zoomLimits);
  if (zlOpts) {
    zoomLimits = new ZoomLimits(zlOpts);
    plugins.push(zoomLimits);
  }

  const kbOpts = asOpts<KeyboardOptions>(initial.keyboard);
  if (kbOpts) {
    keyboard = new Keyboard(kbOpts);
    plugins.push(keyboard);
  }

  const measureEnabled = initial.measure != null || initial.onMeasure != null;
  if (measureEnabled) {
    const base = asOpts<MeasureOptions>(initial.measure) ?? {};
    measure = new Measure({
      ...base,
      onMeasure: (r) => onMeasureRef?.(r),
    });
    plugins.push(measure);
  }

  const brushEnabled =
    initial.brushSelect != null || initial.onBrushSelect != null;
  if (brushEnabled) {
    const base =
      asOpts<Omit<BrushSelectOptions, "onSelect" | "active">>(
        initial.brushSelect,
      ) ?? {};
    brush = new BrushSelect({
      ...base,
      active: Boolean(initial.brushActive),
      onSelect: (r) => onBrushRef?.(r),
    });
    plugins.push(brush);
  }

  const urlOpts = asOpts<UrlSyncOptions>(initial.urlSync);
  if (urlOpts) {
    urlSync = new UrlSync(urlOpts);
    plugins.push(urlSync);
  }

  const spanOpts = spanOptions(initial.spanBands);
  if (spanOpts) {
    spanBands = new SpanBands(spanOpts);
    plugins.push(spanBands);
  }

  const plotterKey = (props: ExtrasProps) =>
    JSON.stringify({
      ma: props.movingAverage ?? null,
      fb: props.fillBetween ?? null,
    });

  return {
    mergeIntoOptions(opts) {
      userPlotter = opts?.plotter;
      const merged: Partial<ZpgraphOptions> = { ...opts };
      if (plugins.length) {
        const prev = Array.isArray(merged.plugins) ? merged.plugins : [];
        merged.plugins = [...prev, ...plugins];
      }
      const plotters = buildPlotters(userPlotter, initial);
      if (plotters) {
        merged.plotter = plotters;
        lastPlotterKey = plotterKey(initial);
      }
      return Object.keys(merged).length ? merged : opts;
    },

    afterMount(g) {
      const locale = resolveLocale(initial.locale);
      if (locale && isLocaleTarget(g)) {
        applyLocale(g, locale);
      }
    },

    sync(props, g) {
      onMeasureRef = props.onMeasure;
      onBrushRef = props.onBrushSelect;

      if (!zoomLimits) {
        const next = asOpts<ZoomLimitsOptions>(props.zoomLimits);
        if (next && g && hasAddPlugins(g)) {
          zoomLimits = new ZoomLimits(next);
          plugins.push(zoomLimits);
          g.addPlugins([zoomLimits]);
        }
      } else if (props.zoomLimits && props.zoomLimits !== true) {
        zoomLimits.opts_ = props.zoomLimits;
      }

      if (!keyboard) {
        const next = asOpts<KeyboardOptions>(props.keyboard);
        if (next && g && hasAddPlugins(g)) {
          keyboard = new Keyboard(next);
          plugins.push(keyboard);
          g.addPlugins([keyboard]);
        }
      } else if (props.keyboard && props.keyboard !== true) {
        keyboard.opts_ = { ...keyboard.opts_, ...props.keyboard };
      }

      if (!measure && (props.measure != null || props.onMeasure != null) && g && hasAddPlugins(g)) {
        const base = asOpts<MeasureOptions>(props.measure) ?? {};
        measure = new Measure({
          ...base,
          onMeasure: (r) => onMeasureRef?.(r),
        });
        plugins.push(measure);
        g.addPlugins([measure]);
      }

      if (!brush && (props.brushSelect != null || props.onBrushSelect != null) && g && hasAddPlugins(g)) {
        const base =
          asOpts<Omit<BrushSelectOptions, "onSelect" | "active">>(
            props.brushSelect,
          ) ?? {};
        brush = new BrushSelect({
          ...base,
          active: Boolean(props.brushActive),
          onSelect: (r) => onBrushRef?.(r),
        });
        plugins.push(brush);
        g.addPlugins([brush]);
      }

      if (!urlSync) {
        const next = asOpts<UrlSyncOptions>(props.urlSync);
        if (next && g && hasAddPlugins(g)) {
          urlSync = new UrlSync(next);
          plugins.push(urlSync);
          g.addPlugins([urlSync]);
        }
      }

      if (!spanBands) {
        const nextSpanLate = spanOptions(props.spanBands);
        if (nextSpanLate && g && hasAddPlugins(g)) {
          spanBands = new SpanBands(nextSpanLate);
          plugins.push(spanBands);
          g.addPlugins([spanBands]);
        }
      }

      if (brush && props.brushActive != null) {
        brush.setActive(props.brushActive);
      }

      const nextSpan = spanOptions(props.spanBands);
      if (spanBands && nextSpan) {
        spanBands.setBands(nextSpan.bands);
      }

      if (!g) {
        return;
      }

      const locale = resolveLocale(props.locale);
      if (locale && isLocaleTarget(g)) {
        applyLocale(g, locale);
      }

      const key = plotterKey(props);
      if (key === lastPlotterKey) {
        return;
      }
      lastPlotterKey = key;
      const rebuilt = buildPlotters(userPlotter, props);
      if (rebuilt) {
        g.updateOptions({ plotter: rebuilt });
      } else if (!props.movingAverage && !props.fillBetween && userPlotter) {
        g.updateOptions({ plotter: userPlotter });
      }
    },

    destroy() {
      zoomLimits?.destroy?.();
      keyboard?.destroy?.();
      measure?.destroy?.();
      brush?.destroy?.();
      urlSync?.destroy?.();
      zoomLimits = keyboard = measure = brush = urlSync = null;
      spanBands = null;
    },

    setBrushActive(active) {
      brush?.setActive(active);
    },

    clearMeasure() {
      measure?.clear();
    },
  };
};
