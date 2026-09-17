import { Zpgraph } from "react-zpgraph";
import { makeDualAxis } from "./data";

const data = makeDualAxis(85);

export const TwoAxesDemo = () => (
  <section className="panel">
    <h2>Two y-axes</h2>
    <p className="hint">
      Independent scales — small series on y, large magnitude on y2.
    </p>
    <div className="chart-box">
      <Zpgraph
        data={data}
        theme="dark"
        options={{
          labels: ["Date", "Temp", "Load", "Ambient"],
          tooltip: { show: "always" },
          title: "Mixed magnitudes",
          ylabel: "°C",
          y2label: "Load",
          animatedZooms: true,
          series: {
            Temp: { axis: "y1" },
            Ambient: { axis: "y1" },
            Load: { axis: "y2" },
          },
          axes: {
            y: { valueRange: [0, 40] },
            y2: { independentTicks: true },
          },
          colors: ["#38bdf8", "#fbbf24", "#94a3b8"],
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  </section>
);
