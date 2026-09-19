import { useMemo, useState } from "react";
import {
  Zpgraph,
  ZpgraphCore,
  type InteractionContext,
} from "react-zpgraph";

const hourMs = 3_600_000;
const MIN_ZOOM_MS = hourMs;

const quarterHourMs = hourMs / 4;
const data = Array.from({ length: 96 }, (_, i) => {
  const t = Date.UTC(2024, 0, 1) + i * quarterHourMs;
  return [
    new Date(t),
    20 + Math.sin(i / 8) * 6,
    14 + Math.cos(i / 11) * 4,
  ] as [Date, number, number];
});

export const InteractionModelDemo = () => {
  const [msg, setMsg] = useState("");

  const interactionModel = useMemo(() => {
    const base = ZpgraphCore.defaultInteractionModel;
    return {
      ...base,
      mouseup: (
        event: MouseEvent,
        g: unknown,
        context: InteractionContext,
      ) => {
        const start = context.dragStartX;
        const end = context.dragEndX;
        if (typeof start === "number" && typeof end === "number") {
          const chart = g as InstanceType<typeof ZpgraphCore>;
          const minDate = chart.toDataXCoord(Math.min(start, end));
          const maxDate = chart.toDataXCoord(Math.max(start, end));
          const selectedRange =
            minDate != null && maxDate != null ? maxDate - minDate : 0;
          if (selectedRange > 0 && selectedRange < MIN_ZOOM_MS) {
            setMsg("Zoom rejected: range shorter than 1 hour");
            context.dragEndX = null;
            context.dragStartX = null;
            return;
          }
        }
        setMsg("");
        base.mouseup?.(event, g, context);
      },
    };
  }, []);

  return (
    <section className="panel">
      <h2>Custom interaction model</h2>
      <p className="hint">
        Drag-zoom a span shorter than 1 hour is cancelled (series is 24h).
        Built from <code>ZpgraphCore.defaultInteractionModel</code> — no{" "}
        <code>zpgraph</code> import.
      </p>
      {msg ? <p className="hint">{msg}</p> : null}
      <div className="chart-box">
        <Zpgraph
          data={data}
          theme="dark"
          options={{
            labels: ["Date", "Alpha", "Beta"],
            tooltip: { show: "always" },
            animatedZooms: true,
            colors: ["#818cf8", "#34d399"],
            interactionModel,
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </section>
  );
};
