import { Zpgraph } from "react-zpgraph";
import { makeSeries } from "./data";

const data = makeSeries({ points: 90, series: 2 });

export const BasicDemo = () => (
  <section className="panel">
    <h2>Basic</h2>
    <p className="hint">
      Declarative mount — drag to zoom, double-click to reset.
    </p>
    <div className="chart-box">
      <Zpgraph
        data={data}
        theme="dark"
        options={{
          labels: ["Date", "Alpha", "Beta"],
          legend: "always",
          title: "Sample timeseries",
          ylabel: "Value",
          animatedZooms: true,
          colors: ["#38bdf8", "#fb7185"],
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  </section>
);
