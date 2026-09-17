import { useMemo, useState } from "react";
import { Zpgraph } from "react-zpgraph";
import type { MeasureResult } from "zpgraph/extras/measure";
import type { BrushSelectResult } from "zpgraph/extras/brush-select";
import { makeSeries, utcDay, dayMs } from "./data";

const data = makeSeries({ points: 90, series: 2, seed: 4 });
const t0 = utcDay(2024, 0, 1);

export const ExtrasDemo = () => {
  const [brushOn, setBrushOn] = useState(false);
  const [msg, setMsg] = useState("");

  const bands = useMemo(
    () => [
      {
        x0: t0,
        x1: t0 + 20 * dayMs,
        color: "rgba(255,69,96,0.75)",
        label: "Off",
        labelStyle: {
          className: "extras-chip extras-chip--off",
          style: { "font-weight": "700" },
        },
      },
      {
        x0: t0 + 20 * dayMs,
        x1: t0 + 55 * dayMs,
        color: "rgba(0,143,251,0.75)",
        label: "Auto",
        labelStyle: { className: "extras-chip extras-chip--auto" },
      },
      {
        x0: t0 + 55 * dayMs,
        x1: t0 + 90 * dayMs,
        color: "rgba(0,227,150,0.75)",
        label: "Cont",
        labelStyle: { className: "extras-chip extras-chip--cont" },
      },
    ],
    [],
  );

  const dateWindow = useMemo(
    (): [number, number] => [t0 + 10 * dayMs, t0 + 50 * dayMs],
    [],
  );

  return (
    <section className="panel extras-demo">
      <h2>Extras + label style</h2>
      <p className="hint">
        Core <code>labelStyle</code> / <code>classNames.*</code> + React{" "}
        <code>render*Label</code>. Click twice to measure; toggle brush for
        range select. Click chart to focus: arrows pan, <kbd>+/−</kbd> zoom,{" "}
        <kbd>Esc</kbd> reset.
      </p>
      <div className="toolbar">
        <button type="button" onClick={() => setBrushOn((v) => !v)}>
          {brushOn ? "Disable brush" : "Enable brush"}
        </button>
        <span className="extras-msg">{msg || "—"}</span>
      </div>
      <div className="chart-box">
        <Zpgraph
          data={data}
          theme="dark"
          toolbar
          locale="pt"
          zoomLimits={{ minSpanMs: 5 * dayMs }}
          keyboard
          measure={{
            labelStyle: {
              className: "extras-measure",
              style: { "letter-spacing": "0.02em" },
            },
          }}
          onMeasure={(r: MeasureResult) => {
            setMsg(
              `Δx=${Math.round(r.deltaX / dayMs)}d Δy=${r.deltaY.toFixed(1)}`,
            );
          }}
          brushSelect
          brushActive={brushOn}
          onBrushSelect={(r: BrushSelectResult) => {
            setMsg(
              `brush ${new Date(r.xRange[0]).toISOString().slice(0, 10)}→${new Date(r.xRange[1]).toISOString().slice(0, 10)}`,
            );
          }}
          spanBands={bands}
          movingAverage={{ period: 7, color: "#fbbf24" }}
          classNames={{
            thresholdLabel: "extras-threshold",
            spanBandLabel: "extras-span-slot",
            measureLabel: "extras-measure-slot",
          }}
          thresholds={[
            {
              y: 16,
              y2: 26,
              fillColor: "rgba(56,189,248,0.12)",
              color: "#38bdf8",
              label: "Ideal",
              labelStyle: {
                className: "extras-threshold-chip",
                style: { "font-weight": "700" },
              },
            },
          ]}
          renderThresholdLabel={(band) => (
            <span className="extras-react-threshold">
              <span className="extras-react-threshold__dot" />
              {band.label}
            </span>
          )}
          renderSpanBandLabel={(band) => (
            <span
              className={`extras-react-band extras-react-band--${band.label?.toLowerCase()}`}
            >
              {band.label}
            </span>
          )}
          renderMeasureLabel={({ dx, dy }) => (
            <span className="extras-react-measure">
              <strong>{dx}</strong>
              <span aria-hidden>·</span>
              <strong>{dy}</strong>
            </span>
          )}
          options={{
            labels: ["Date", "A", "B"],
            tooltip: { show: "always" },
            colors: ["#38bdf8", "#34d399"],
            animatedZooms: true,
            dateWindow,
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </section>
  );
};
