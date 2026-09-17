import type { CSSProperties } from "react";
import type Zpgraph from "zpgraph";
import type { ChartClassNames, ChartTheme, Data, ZpgraphOptions } from "zpgraph";

export type ZpgraphHandle = {
  getInstance: () => Zpgraph | null;
  updateOptions: (
    opts: Partial<ZpgraphOptions>,
    blockRedraw?: boolean,
  ) => void;
  resize: () => void;
  destroy: () => void;
};

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
};
