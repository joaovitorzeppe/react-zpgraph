import { Zpgraph, type LegendData } from "react-zpgraph";
import { makeSeries } from "./data";

const data = makeSeries({ points: 70, series: 3, seed: 3 });

const Legend = ({ data }: { data: LegendData }) => (
  <div className="legend-react">
    <div className="x">{data.xHTML}</div>
    {data.series
      .filter((s) => s.isVisible)
      .map((s) => (
        <div key={s.label} className="row">
          <span className="dot" style={{ background: s.color }} />
          <span>
            {s.label} <b>{s.yHTML}</b>
          </span>
        </div>
      ))}
  </div>
);

export const RenderLegendDemo = () => (
  <section className="panel">
    <h2>renderLegend</h2>
    <p className="hint">
      React legend via <code>renderLegend</code> — no HTML strings.
    </p>
    <div className="chart-box">
      <Zpgraph
        data={data}
        theme="dark"
        options={{
          labels: ["Date", "A", "B", "C"],
          legend: "follow",
          title: " ",
          animatedZooms: true,
          colors: ["#a3e635", "#e879f9", "#22d3ee"],
        }}
        renderTitle={<p className="brand-title">React legend slot</p>}
        renderLegend={(d) => <Legend data={d} />}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  </section>
);
