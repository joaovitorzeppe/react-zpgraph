import { useState } from "react";
import { Zpgraph } from "react-zpgraph";
import { makeSeries } from "./data";

const data = makeSeries({ points: 80, series: 2, seed: 2 });

export const ThemeDemo = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  return (
    <section className="panel">
      <h2>Theme</h2>
      <p className="hint">
        Prop <code>theme</code> toggles CSS tokens + canvas chrome presets.
      </p>
      <div className="toolbar">
        <button type="button" onClick={() => setTheme("light")}>
          Light
        </button>
        <button type="button" onClick={() => setTheme("dark")}>
          Dark
        </button>
      </div>
      <div
        className="chart-box"
        style={{
          background: theme === "light" ? "#e8eef2" : undefined,
        }}
      >
        <Zpgraph
          data={data}
          theme={theme}
          options={{
            labels: ["Date", "Temp", "Humidity"],
            tooltip: { show: "always" },
            title: "Themed chart",
            ylabel: "Reading",
            animatedZooms: true,
            colors: ["#1b6b93", "#c45c26"],
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </section>
  );
};
