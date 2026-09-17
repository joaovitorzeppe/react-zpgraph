import { useEffect, useState } from "react";
import { Zpgraph } from "react-zpgraph";
import { dayMs, makeSeries } from "./data";

export const LiveDemo = () => {
  const [data, setData] = useState(() =>
    makeSeries({ points: 40, series: 1, seed: 11 }),
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1]!;
        const t = last[0].getTime() + dayMs;
        const y = Number(last[1]) + (Math.random() - 0.45) * 3;
        return [...prev.slice(-80), [new Date(t), y]];
      });
    }, 800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="panel">
      <h2>Live update</h2>
      <p className="hint">
        New <code>data</code> prop updates <code>file</code> in place — no
        destroy/recreate.
      </p>
      <div className="chart-box">
        <Zpgraph
          data={data}
          theme="dark"
          options={{
            labels: ["Date", "Signal"],
            legend: "always",
            title: "Streaming points",
            drawPoints: true,
            strokeWidth: 1.5,
            colors: ["#4ade80"],
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </section>
  );
};
