import { Zpgraph } from "react-zpgraph";
import { makeSeries } from "./data";

const data = makeSeries({ points: 75, series: 2, seed: 9 });

export const ClassNamesDemo = () => (
  <section className="panel">
    <h2>classNames + CSS vars</h2>
    <p className="hint">
      Extra classes on legend / axis labels, plus token overrides on the root.
    </p>
    <div className="chart-box classnames-demo">
      <Zpgraph
        data={data}
        theme="dark"
        classNames={{
          legend: "demo-legend",
          axisLabel: "demo-axis",
          root: "demo-root",
        }}
        options={{
          labels: ["Date", "Alpha", "Beta"],
          tooltip: { show: "always" },
          title: "Styled chrome",
          animatedZooms: true,
          colors: ["#fbbf24", "#c084fc"],
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  </section>
);
