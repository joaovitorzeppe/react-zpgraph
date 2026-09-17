import { createRef, act } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Zpgraph, type ZpgraphHandle } from "../src";
import { createReactHost } from "../src/react-host";

type MockInstance = {
  updateOptions: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  resize: ReturnType<typeof vi.fn>;
};

const state = vi.hoisted(() => ({
  ctorCount: 0,
  lastInstance: null as MockInstance | null,
  lastOpts: null as Record<string, unknown> | null,
  instances: [] as MockInstance[],
}));

vi.mock("zpgraph", () => {
  class MockZpgraph {
    updateOptions = vi.fn();
    destroy = vi.fn();
    resize = vi.fn();
    graphDiv = document.createElement("div");

    constructor(
      _div: HTMLElement,
      _data: unknown,
      opts?: Record<string, unknown>,
    ) {
      state.ctorCount += 1;
      state.lastInstance = this;
      state.lastOpts = opts ?? null;
      state.instances.push(this);
    }
  }

  const themes = {
    light: { axisLineColor: "black", gridLineColor: "rgb(128,128,128)" },
    dark: { axisLineColor: "#c0c0c0", gridLineColor: "rgb(80,80,80)" },
  };

  return { default: MockZpgraph, Zpgraph: MockZpgraph, themes };
});

const sampleData: [Date, number][] = [
  [new Date("2024-01-01"), 1],
  [new Date("2024-01-02"), 2],
];

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  state.ctorCount = 0;
  state.lastInstance = null;
  state.lastOpts = null;
  state.instances = [];
});

describe("Zpgraph", () => {
  it("creates one instance on mount", () => {
    const ref = createRef<ZpgraphHandle>();
    render(<Zpgraph ref={ref} data={sampleData} />);

    expect(state.ctorCount).toBe(1);
    expect(ref.current?.getInstance()).toBe(state.lastInstance);
  });

  it("destroys on unmount", () => {
    const { unmount } = render(<Zpgraph data={sampleData} />);
    const instance = state.lastInstance!;
    unmount();
    expect(instance.destroy).toHaveBeenCalledTimes(1);
  });

  it("updates data via updateOptions({ file }) without a second ctor", () => {
    const nextData: [Date, number][] = [
      [new Date("2024-01-01"), 10],
      [new Date("2024-01-02"), 20],
    ];
    const { rerender } = render(<Zpgraph data={sampleData} />);
    const instance = state.lastInstance!;

    rerender(<Zpgraph data={nextData} />);

    expect(state.ctorCount).toBe(1);
    expect(instance.updateOptions).toHaveBeenCalledWith({ file: nextData });
  });

  it("keeps the same instance across ref.getInstance()", () => {
    const ref = createRef<ZpgraphHandle>();
    const { rerender } = render(
      <Zpgraph ref={ref} data={sampleData} options={{ tooltip: { show: "always" } }} />,
    );
    const first = ref.current?.getInstance();

    rerender(
      <Zpgraph
        ref={ref}
        data={sampleData}
        options={{ tooltip: { position: "follow" } }}
      />,
    );

    expect(ref.current?.getInstance()).toBe(first);
    expect(state.ctorCount).toBe(1);
  });

  it("forwards imperative updateOptions / resize", () => {
    const ref = createRef<ZpgraphHandle>();
    render(<Zpgraph ref={ref} data={sampleData} />);
    const instance = state.lastInstance!;

    ref.current?.updateOptions({ strokeWidth: 3 });
    ref.current?.resize();

    expect(instance.updateOptions).toHaveBeenCalledWith(
      { strokeWidth: 3 },
      undefined,
    );
    expect(instance.resize).toHaveBeenCalled();
  });

  it("sets data-theme on the wrapper when theme is dark", () => {
    const { container } = render(
      <Zpgraph data={sampleData} theme="dark" />,
    );
    expect(container.firstElementChild?.getAttribute("data-theme")).toBe(
      "dark",
    );
  });

  it("merges dark theme preset into updateOptions when theme changes", () => {
    const { rerender } = render(
      <Zpgraph data={sampleData} theme="light" />,
    );
    const instance = state.lastInstance!;
    instance.updateOptions.mockClear();

    rerender(<Zpgraph data={sampleData} theme="dark" />);

    expect(state.ctorCount).toBe(1);
    expect(instance.updateOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: "dark",
        axisLineColor: "#c0c0c0",
        gridLineColor: "rgb(80,80,80)",
      }),
    );
  });

  it("forwards classNames into options on mount", () => {
    render(
      <Zpgraph
        data={sampleData}
        classNames={{ legend: "rounded-md p-3" }}
      />,
    );
    expect(state.lastOpts).toEqual({
      classNames: { legend: "rounded-md p-3" },
    });
  });

  it("injects legendFormatter when renderLegend is set", () => {
    render(
      <Zpgraph
        data={sampleData}
        renderLegend={(data) => <span>{data.xHTML}</span>}
      />,
    );
    expect(typeof state.lastOpts?.legendFormatter).toBe("function");
    const fmt = state.lastOpts!.legendFormatter as (
      data: { xHTML?: string; series: []; i: null },
    ) => HTMLElement;
    let node!: HTMLElement;
    act(() => {
      node = fmt({ xHTML: "hi", series: [], i: null });
    });
    expect(node).toBeInstanceOf(HTMLElement);
    expect(node.textContent).toContain("hi");
  });

  it("injects drawCallback when renderTitle is set", () => {
    render(
      <Zpgraph data={sampleData} renderTitle={<strong>Title</strong>} />,
    );
    expect(typeof state.lastOpts?.drawCallback).toBe("function");
  });

  it("renderLegend wins over options.legendFormatter", () => {
    const legacy = vi.fn(() => "legacy");
    render(
      <Zpgraph
        data={sampleData}
        options={{ legendFormatter: legacy }}
        renderLegend={() => <span>react</span>}
      />,
    );
    const fmt = state.lastOpts!.legendFormatter as () => HTMLElement;
    let node!: HTMLElement;
    act(() => {
      node = fmt();
    });
    expect(legacy).not.toHaveBeenCalled();
    expect(node.textContent).toContain("react");
  });
});

describe("createReactHost", () => {
  it("renders and disposes without throwing", () => {
    const host = createReactHost();
    act(() => {
      host.render(<div data-testid="x">ok</div>);
    });
    expect(host.element.textContent).toBe("ok");
    act(() => {
      host.dispose();
    });
    expect(host.element.textContent).toBe("");
    act(() => {
      host.render(<div>ignored</div>);
    });
    expect(host.element.textContent).toBe("");
  });
});
