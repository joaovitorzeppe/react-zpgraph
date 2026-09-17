import { useRef, useState } from "react";
import { Zpgraph, type ZpgraphHandle } from "react-zpgraph";
import { makeSeries } from "./data";

const data = makeSeries({ points: 90, series: 1, seed: 3 });

export const ChartFeaturesDemo = () => {
  const ref = useRef<ZpgraphHandle>(null);
  const [loading, setLoading] = useState(false);

  return (
    <section className="panel">
      <h2>Chart features</h2>
      <p className="hint">
        Toolbar, thresholds, forecast, export via ref, loading overlay.
      </p>
      <div className="toolbar">
        <button type="button" onClick={() => setLoading((v) => !v)}>
          Toggle loading
        </button>
        <button
          type="button"
          onClick={() => {
            const csv = ref.current?.toCsv();
            if (csv) console.log(csv.slice(0, 200));
          }}
        >
          Log CSV
        </button>
        <button type="button" onClick={() => ref.current?.resetZoom()}>
          Reset
        </button>
      </div>
      <div className="chart-box">
        <Zpgraph
          ref={ref}
          data={data}
          theme="dark"
          loading={loading}
          toolbar
          thresholds={[
            {
              y: 10,
              y2: 20,
              fillColor: "rgba(56,189,248,0.15)",
              color: "#38bdf8",
              label: "Band",
            },
          ]}
          options={{
            labels: ["Date", "Alpha"],
            legend: "always",
            animatedZooms: true,
            fillGraph: true,
            fillGradient: {
              from: "#38bdf8",
              to: "#38bdf8",
              opacityFrom: 0.4,
              opacityTo: 0,
            },
            forecast: { count: 10 },
            colors: ["#38bdf8"],
          }}
          renderTooltip={(d) => (
            <div>
              <strong>{d.xHTML}</strong>
              {d.series
                .filter((s) => s.isVisible)
                .map((s) => (
                  <div key={s.label} style={{ color: s.color }}>
                    {s.label}: {s.yHTML}
                  </div>
                ))}
            </div>
          )}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </section>
  );
};
