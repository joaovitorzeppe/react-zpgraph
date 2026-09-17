import { useMemo, useRef } from "react";
import { Zpgraph, type ZpgraphHandle } from "react-zpgraph";
import type { ToolbarOptions } from "zpgraph";
import { makeSeries } from "./data";

const data = makeSeries({ points: 80, series: 1, seed: 7 });

const svgIcon = (path: string) => () => {
  const wrap = document.createElement("span");
  wrap.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${path}</svg>`;
  return wrap.firstElementChild as Node;
};

const badgeIcon = (label: string, bg: string) => () => {
  const el = document.createElement("span");
  el.textContent = label;
  el.style.cssText =
    `display:inline-flex;align-items:center;justify-content:center;` +
    `min-width:1.35rem;height:1.1rem;padding:0 4px;border-radius:3px;` +
    `font:700 10px/1 ui-sans-serif,system-ui;color:#fff;background:${bg}`;
  return el;
};

export const ToolbarDemo = () => {
  const iconsRef = useRef<ZpgraphHandle>(null);
  const slotRef = useRef<ZpgraphHandle>(null);

  const iconsToolbar = useMemo<ToolbarOptions>(
    () => ({
      tools: [
        "zoomin",
        "zoomout",
        "pan",
        "reset",
        "downloadPng",
        "downloadCsv",
      ],
      position: "top-right",
      labels: {
        zoomin: "Zoom in",
        zoomout: "Zoom out",
        pan: "Pan",
        reset: "Reset",
        downloadPng: "PNG",
        downloadCsv: "CSV",
      },
      icons: {
        zoomin: svgIcon(
          '<circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6M21 21l-4.3-4.3"/>',
        ),
        zoomout: svgIcon(
          '<circle cx="11" cy="11" r="7"/><path d="M8 11h6M21 21l-4.3-4.3"/>',
        ),
        pan: badgeIcon("PAN", "#c45c26"),
        reset: badgeIcon("↺", "#2a9d8f"),
        downloadPng: "PNG",
        downloadCsv: () => {
          const el = document.createElement("strong");
          el.textContent = "CSV";
          el.style.fontSize = "11px";
          return el;
        },
      },
    }),
    [],
  );

  return (
    <>
      <section className="panel">
        <h2>Toolbar · custom icons / Nodes</h2>
        <p className="hint">
          <code>toolbar.icons</code>: SVG factory, badge Node, plain text, and{" "}
          <code>() =&gt; HTMLElement</code>.
        </p>
        <div className="chart-box">
          <Zpgraph
            ref={iconsRef}
            data={data}
            theme="dark"
            toolbar={iconsToolbar}
            options={{
              labels: ["Date", "Alpha"],
              tooltip: { show: "onmouseover" },
              animatedZooms: true,
              colors: ["#38bdf8"],
            }}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </section>

      <section className="panel">
        <h2>Toolbar · renderToolbar slot</h2>
        <p className="hint">
          React portal into <code>.zpgraph-toolbar</code> — full custom UI; call
          ref APIs.
        </p>
        <div className="chart-box">
          <Zpgraph
            ref={slotRef}
            data={data}
            theme="dark"
            toolbar={{
              tools: ["reset"],
              position: "top-right",
            }}
            renderToolbar={
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  padding: "2px 4px",
                  fontSize: 12,
                }}
              >
                <button
                  type="button"
                  onClick={() => slotRef.current?.resetZoom()}
                >
                  Reset (React)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const csv = slotRef.current?.toCsv();
                    if (csv) console.log(csv.slice(0, 120));
                  }}
                >
                  Log CSV
                </button>
              </div>
            }
            options={{
              labels: ["Date", "Alpha"],
              tooltip: { show: "always", position: "top-left" },
              animatedZooms: true,
              colors: ["#fb7185"],
            }}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </section>
    </>
  );
};
