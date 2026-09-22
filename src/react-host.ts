/**
 * @license
 * Copyright (c) 2026 João Vitor Zeppe (zeppejoaovitor@gmail.com)
 * MIT-licensed: https://opensource.org/license/MIT
 */

import type { ReactNode } from "react";
import * as ReactDOM from "react-dom";
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
  // React 18 / 19
  if (typeof createRoot === "function") {
    const root = createRoot(container);
    return {
      render: (node) => {
        root.render(node);
      },
      unmount: () => {
        root.unmount();
      },
    };
  }

  // React 17 (and React 18 deprecated path)
  const legacyRender: unknown = Reflect.get(ReactDOM, "render");
  const legacyUnmount: unknown = Reflect.get(
    ReactDOM,
    "unmountComponentAtNode",
  );
  if (
    typeof legacyRender !== "function" ||
    typeof legacyUnmount !== "function"
  ) {
    throw new Error(
      "react-zpgraph: need React 18+ (react-dom/client) or React 17 ReactDOM.render",
    );
  }

  return {
    render: (node) => {
      Function.prototype.call.call(legacyRender, ReactDOM, node, container);
    },
    unmount: () => {
      Function.prototype.call.call(legacyUnmount, ReactDOM, container);
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
