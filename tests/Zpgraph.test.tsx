import { createRef } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Zpgraph, type ZpgraphHandle } from "../src";

type MockInstance = {
  updateOptions: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  resize: ReturnType<typeof vi.fn>;
};

const state = vi.hoisted(() => ({
  ctorCount: 0,
  lastInstance: null as MockInstance | null,
  lastOpts: null as unknown,
  instances: [] as MockInstance[],
}));

vi.mock("zpgraph", () => {
  class MockZpgraph {
    updateOptions = vi.fn();
    destroy = vi.fn();
    resize = vi.fn();

    constructor(
      _div: HTMLElement,
      _data: unknown,
      opts?: unknown,
    ) {
      state.ctorCount += 1;
      state.lastInstance = this;
      state.lastOpts = opts;
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
      <Zpgraph ref={ref} data={sampleData} options={{ legend: "always" }} />,
    );
    const first = ref.current?.getInstance();

    rerender(
      <Zpgraph
        ref={ref}
        data={sampleData}
        options={{ legend: "follow" }}
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
});
