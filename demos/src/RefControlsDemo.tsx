import { useRef } from "react";
import { Zpgraph, type ZpgraphHandle } from "react-zpgraph";
import { makeSeries } from "./data";

const data = makeSeries({ points: 100, series: 2, seed: 7 });

export const RefControlsDemo = () => {
  const ref = useRef<ZpgraphHandle>(null);

  return (
    <section className="panel">
      <h2>Imperative ref</h2>
      <p className="hint">
        Zoom / reset via <code>ref.getInstance()</code> — same pattern as the
        front app toolbar.
      </p>
      <div className="toolbar">
        <button
          type="button"
          onClick={() => {
            const g = ref.current?.getInstance();
            if (!g) return;
            const [x0, x1] = g.xAxisRange();
            const mid = (x0 + x1) / 2;
            const half = (x1 - x0) * 0.35;
            g.updateOptions({ dateWindow: [mid - half, mid + half] });
          }}
        >
          Zoom in
        </button>
        <button
          type="button"
          onClick={() => ref.current?.getInstance()?.resetZoom()}
        >
          Reset zoom
        </button>
        <button
          type="button"
          onClick={() =>
            ref.current?.updateOptions({
              visibility: [true, false],
            })
          }
        >
          Hide Beta
        </button>
        <button
          type="button"
          onClick={() =>
            ref.current?.updateOptions({
              visibility: [true, true],
            })
          }
        >
          Show all
        </button>
      </div>
      <div className="chart-box">
        <Zpgraph
          ref={ref}
          data={data}
          theme="dark"
          options={{
            labels: ["Date", "Alpha", "Beta"],
            legend: "always",
            title: "Controlled chart",
            animatedZooms: true,
            colors: ["#f472b6", "#2dd4bf"],
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </section>
  );
};
