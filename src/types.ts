import type { CSSProperties } from "react";
import type Zpgraph from "zpgraph";
import type { Data, ZpgraphOptions } from "zpgraph";

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
  className?: string;
  style?: CSSProperties;
  onReady?: (g: Zpgraph) => void;
};
