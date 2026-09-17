/**
 * @license
 * Copyright (c) 2026 João Vitor Zeppe (zeppejoaovitor@gmail.com)
 * MIT-licensed: https://opensource.org/license/MIT
 */

import ZpgraphCore from "zpgraph";
import type { Plugin, Plotter, ZpgraphOptions } from "zpgraph";
import type Zpgraph from "zpgraph";

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

const resolveLocale = (locale: LocaleProp | undefined): LocalePack | null => {
  if (locale == null) return null;
  if (typeof locale === "string") {
    return packs[locale] ?? null;
  }
  return locale;
};

const asOpts = <T extends object>(value: boolean | T | undefined): T | null => {
  if (value === true) return {} as T;
  if (value && typeof value === "object") return value;
  return null;
};

const normalizePlotters = (
  plotter: ZpgraphOptions["plotter"],
): Plotter[] | null => {
  if (!plotter) return null;
  return Array.isArray(plotter) ? [...plotter] : [plotter];
};

const defaultPlotters = (): Plotter[] | null => {
  const P = ZpgraphCore.Plotters;
  if (!P?.fillPlotter || !P?.linePlotter) return null;
  return [
    P.fillPlotter as Plotter,
    P.errorPlotter as Plotter,
    P.linePlotter as Plotter,
  ];
};

const buildPlotters = (
  user: ZpgraphOptions["plotter"],
  props: ExtrasProps,
): Plotter[] | null => {
  const maOpts = asOpts<MovingAverageOptions>(props.movingAverage);
  const fbOpts = props.fillBetween ?? null;
  if (!maOpts && !fbOpts) return null;

  let list = normalizePlotters(user) ?? defaultPlotters();
  if (!list) return null;

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
  if (!value) return null;
  if (Array.isArray(value)) return { bands: value };
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
    plugins.push(zoomLimits as unknown as Plugin);
  }

  const kbOpts = asOpts<KeyboardOptions>(initial.keyboard);
  if (kbOpts) {
    keyboard = new Keyboard(kbOpts);
    plugins.push(keyboard as unknown as Plugin);
  }

  const measureEnabled = initial.measure != null || initial.onMeasure != null;
  if (measureEnabled) {
    const base = asOpts<MeasureOptions>(initial.measure) ?? {};
    measure = new Measure({
      ...base,
      onMeasure: (r) => onMeasureRef?.(r),
    });
    plugins.push(measure as unknown as Plugin);
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
      active: !!initial.brushActive,
      onSelect: (r) => onBrushRef?.(r),
    });
    plugins.push(brush as unknown as Plugin);
  }

  const urlOpts = asOpts<UrlSyncOptions>(initial.urlSync);
  if (urlOpts) {
    urlSync = new UrlSync(urlOpts);
    plugins.push(urlSync as unknown as Plugin);
  }

  const spanOpts = spanOptions(initial.spanBands);
  if (spanOpts) {
    spanBands = new SpanBands(spanOpts);
    plugins.push(spanBands as unknown as Plugin);
  }

  const plotterKey = (props: ExtrasProps) =>
    JSON.stringify({
      ma: props.movingAverage ?? null,
      fb: props.fillBetween ?? null,
    });

  return {
    mergeIntoOptions(opts) {
      userPlotter = opts?.plotter;
      const merged: Partial<ZpgraphOptions> = { ...(opts ?? {}) };
      if (plugins.length) {
        const prev = (merged.plugins as Plugin[] | undefined) ?? [];
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
      if (locale) applyLocale(g as never, locale);
    },

    sync(props, g) {
      onMeasureRef = props.onMeasure;
      onBrushRef = props.onBrushSelect;

      if (zoomLimits && props.zoomLimits && props.zoomLimits !== true) {
        (zoomLimits as { opts_: ZoomLimitsOptions }).opts_ = props.zoomLimits;
      }

      if (brush && props.brushActive != null) {
        brush.setActive(!!props.brushActive);
      }

      const nextSpan = spanOptions(props.spanBands);
      if (spanBands && nextSpan) {
        spanBands.setBands(nextSpan.bands);
      }

      if (!g) return;

      const locale = resolveLocale(props.locale);
      if (locale) applyLocale(g as never, locale);

      const key = plotterKey(props);
      if (key === lastPlotterKey) return;
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
