import type { CSSProperties, ReactNode } from "react";
import type {
  ChartAnnotations,
  ChartClassNames,
  ChartTheme,
  Data,
  LegendData,
  Point,
  ThresholdBand,
  ToolbarOptions,
  Zpgraph,
  ZpgraphOptions,
} from "zpgraph";
import type { ExtrasProps } from "./extras-bridge";

export type ZpgraphHandle = {
  getInstance: () => Zpgraph | null;
  updateOptions: (opts: Partial<ZpgraphOptions>, blockRedraw?: boolean) => void;
  resize: () => void;
  destroy: () => void;
  toPng: (opts?: { scale?: number; background?: string }) => string;
  toCsv: (opts?: { includeHeader?: boolean }) => string;
  resetZoom: () => void;
  setAnnotations: (ann: Parameters<Zpgraph["setAnnotations"]>[0]) => void;
  setBrushActive: (active: boolean) => void;
  clearMeasure: () => void;
};

export type LabelRender = ReactNode | (() => ReactNode);

export type ZpgraphProps = {
  data: Data;
  options?: Partial<ZpgraphOptions>;
  /** Sets data-theme on the wrapper and merges canvas chrome from zpgraph themes. */
  theme?: ChartTheme;
  /** Extra CSS classes on chart DOM nodes (merged into options.classNames). */
  classNames?: ChartClassNames;
  className?: string;
  style?: CSSProperties;
  onReady?: (g: Zpgraph) => void;
  loading?: boolean;
  toolbar?: boolean | ToolbarOptions;
  thresholds?: ThresholdBand[];
  chartAnnotations?: ChartAnnotations;
  /**
   * React legend. Wins over `options.legendFormatter`.
   * Bridged via a reused host node returned to the core as a DOM Node.
   */
  renderLegend?: (data: LegendData) => ReactNode;
  /** Alias of `renderLegend` (tooltip = legend hover). */
  renderTooltip?: (data: LegendData) => ReactNode;
  renderNoData?: LabelRender;
  renderToolbar?: LabelRender;
  /** React content for the chart title (portaled into `.zpgraph-title`). */
  renderTitle?: LabelRender;
  /** React content for the x-axis label (`.zpgraph-xlabel`). */
  renderXLabel?: LabelRender;
  /** React content for the y-axis label (`.zpgraph-ylabel`). */
  renderYLabel?: LabelRender;
  /** React content for the y2-axis label (`.zpgraph-y2label`). */
  renderY2Label?: LabelRender;
  /** Override threshold label chips (DOM). */
  renderThresholdLabel?: (
    band: ThresholdBand,
    index: number,
  ) => ReactNode;
  /** Override span-band label chips (DOM). */
  renderSpanBandLabel?: (
    band: import("zpgraph/extras/span-bands").SpanBand,
    index: number,
  ) => ReactNode;
  /** Override measure Δ overlay (DOM). */
  renderMeasureLabel?: (info: {
    result: import("zpgraph/extras/measure").MeasureResult | null;
    dx: string;
    dy: string;
  }) => ReactNode;
  onZoom?: (
    minDate: number,
    maxDate: number,
    yRanges: Array<[number, number] | null>,
  ) => void;
  onPointClick?: (event: MouseEvent, point: Point) => void;
} & ExtrasProps;

export type { ExtrasProps, LocaleProp } from "./extras-bridge";
