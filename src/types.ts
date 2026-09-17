import type { CSSProperties, ReactNode } from "react";
import type Zpgraph from "zpgraph";
import type {
  ChartClassNames,
  ChartTheme,
  Data,
  LegendData,
  ZpgraphOptions,
} from "zpgraph";

export type ZpgraphHandle = {
  getInstance: () => Zpgraph | null;
  updateOptions: (
    opts: Partial<ZpgraphOptions>,
    blockRedraw?: boolean,
  ) => void;
  resize: () => void;
  destroy: () => void;
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
  /**
   * React legend. Wins over `options.legendFormatter`.
   * Bridged via a reused host node returned to the core as a DOM Node.
   */
  renderLegend?: (data: LegendData) => ReactNode;
  /** React content for the chart title (portaled into `.zpgraph-title`). */
  renderTitle?: LabelRender;
  /** React content for the x-axis label (`.zpgraph-xlabel`). */
  renderXLabel?: LabelRender;
  /** React content for the y-axis label (`.zpgraph-ylabel`). */
  renderYLabel?: LabelRender;
  /** React content for the y2-axis label (`.zpgraph-y2label`). */
  renderY2Label?: LabelRender;
};
