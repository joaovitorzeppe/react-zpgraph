/**
 * @license
 * Copyright (c) 2026 João Vitor Zeppe (zeppejoaovitor@gmail.com)
 * MIT-licensed: https://opensource.org/license/MIT
 */

import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";

export type ReactHost = {
  element: HTMLElement;
  render: (node: ReactNode) => void;
  dispose: () => void;
};

type RootApi = {
  render: (node: ReactNode) => void;
  unmount: () => void;
};

const attachRoot = (container: HTMLElement): RootApi => {
  const root = createRoot(container);
  return {
    render: (node) => {
      root.render(node);
    },
    unmount: () => {
      root.unmount();
    },
  };
};

/** Reusable host div + React root for bridging ReactNode into zpgraph DOM. */
export const createReactHost = (): ReactHost => {
  const element = document.createElement("div");
  element.className = "zpgraph-react-host";

  let root: RootApi | null = null;
  let disposed = false;

  return {
    element,
    render: (node) => {
      if (disposed) {
        return;
      }
      if (!root) {
        root = attachRoot(element);
      }
      root.render(node);
    },
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      root?.unmount();
      root = null;
    },
  };
};

/** Resolve `ReactNode | (() => ReactNode)` to a node. */
const isNodeThunk = (
  value: ReactNode | (() => ReactNode),
): value is () => ReactNode => typeof value === "function";

export const resolveNode = (
  value: ReactNode | (() => ReactNode) | undefined,
): ReactNode | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return isNodeThunk(value) ? value() : value;
};
