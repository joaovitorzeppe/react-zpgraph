import { Zpgraph } from "react-zpgraph";
import { makeSeries } from "./data";

const data = makeSeries({ points: 120, series: 2, seed: 5 });

export const RangeDemo = () => (
  <section className="panel">
    <h2>Range selector</h2>
    <p className="hint">Minimap under the plot — drag the window to pan.</p>
    <div className="chart-box" style={{ height: 400 }}>
      <Zpgraph
        data={data}
        theme="dark"
        options={{
          labels: ["Date", "Alpha", "Beta"],
          legend: "always",
          title: "With range selector",
          showRangeSelector: true,
          rangeSelectorHeight: 40,
          animatedZooms: true,
          colors: ["#818cf8", "#34d399"],
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  </section>
);
