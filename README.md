# react-zpgraph

React bindings for [zpgraph](https://www.npmjs.com/package/zpgraph) — fast,
typed timeseries charts. Thin wrapper: one chart instance per mount, updates
via `updateOptions`, auto-resize with `ResizeObserver`.

Works with **React 19** and **React 18**.

## Install

```bash
npm install react-zpgraph
```

ESM only. `zpgraph` is a dependency. Types, themes, plugins and extras come from `react-zpgraph`. No CSS import.

```ts
import { Zpgraph, ZpgraphCore, type ThresholdBand } from "react-zpgraph";
import { synchronize } from "react-zpgraph/extras";
```

## Demos

Interactive gallery (basic, theme, `renderLegend`, two axes, range selector,
imperative ref, classNames, live update, toolbar, extras, interaction model):

```bash
npm run demo
```

Opens Vite on port 5174. Source under [`demos/`](./demos).

## Quick start

```tsx
import { useRef } from "react";
import { Zpgraph, type ZpgraphHandle } from "react-zpgraph";

const data = [
  [new Date("2024-01-01"), 10, 20],
  [new Date("2024-01-02"), 12, 18],
];

export function Chart({ isDark }: { isDark: boolean }) {
  const ref = useRef<ZpgraphHandle>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.getInstance()?.resetZoom()}
      >
        Reset zoom
      </button>
      <Zpgraph
        ref={ref}
        data={data}
        theme={isDark ? "dark" : "light"}
        options={{
          labels: ["Date", "Alpha", "Beta"],
          tooltip: { show: "always" },
          animatedZooms: true,
        }}
        style={{ width: "100%", height: 320 }}
      />
    </>
  );
}
```

## Props

| Prop                                                              | Description                                                                                                            |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `data`                                                            | Chart series (`Data`). Changes call `updateOptions({ file })` — no destroy/recreate.                                   |
| `options`                                                         | `Partial<ZpgraphOptions>` (without `file`). Compared by reference. User keys win over theme presets.                   |
| `theme`                                                           | `"light"` \| `"dark"`. Sets `data-theme` on the wrapper and merges canvas chrome from `themes`.                        |
| `classNames`                                                      | Extra classes on DOM nodes (`legend`, `axisLabel`, `title`, …). Merged into `options.classNames`.                      |
| `className` / `style`                                             | Applied to the container `div`.                                                                                        |
| `onReady`                                                         | Called once after construction with the chart instance.                                                                |
| `ref`                                                             | `ZpgraphHandle`: `getInstance`, `updateOptions`, `resize`, `destroy`, `toPng`, `toCsv`, `resetZoom`, `setAnnotations`. |
| `renderLegend`                                                    | `(data) => ReactNode`. Wins over `options.legendFormatter`.                                                            |
| `renderTooltip`                                                   | Alias of `renderLegend` (hover tooltip = legend).                                                                      |
| `renderNoData` / `renderToolbar`                                  | Portaled into core overlay / toolbar nodes.                                                                            |
| `loading` / `toolbar` / `thresholds` / `chartAnnotations`         | Shortcuts merged into options.                                                                                         |
| `onZoom` / `onPointClick`                                         | Typed wrappers around core callbacks.                                                                                  |
| `renderTitle` / `renderXLabel` / `renderYLabel` / `renderY2Label` | `ReactNode` or `() => ReactNode`, portaled into chart label divs.                                                      |
| `renderThresholdLabel` / `renderSpanBandLabel`                    | ReactNode for threshold / span-band chips (DOM).                                                                       |
| `renderMeasureLabel`                                              | ReactNode for measure overlay.                                                                                         |
| `zoomLimits` / `keyboard` / `measure` / `onMeasure`               | Core extras — plugins on first mount.                                                                                  |
| `brushSelect` / `brushActive` / `onBrushSelect`                   | Brush tool; toggle with prop or `ref.setBrushActive`.                                                                  |
| `urlSync`                                                         | URL `from`/`to` sync.                                                                                                  |
| `locale`                                                          | `"pt"` \| `"en"` \| `"es"` \| custom `LocalePack`.                                                                     |
| `spanBands` / `movingAverage` / `fillBetween`                     | X-status strips; overlay MA plotter; fill between two series.                                                          |

## React render props

Use React components for the legend and chart labels.

```tsx
import { Typography, Flex } from "antd";
import { Zpgraph } from "react-zpgraph";

<Zpgraph
  data={data}
  options={{
    labels: ["Date", "Alpha"],
    tooltip: { position: "follow" },
    title: " ",
  }}
  renderLegend={(data) => (
    <div>
      <Typography.Text strong>{data.xHTML}</Typography.Text>
      {data.series
        .filter((s) => s.isVisible)
        .map((s) => (
          <Flex key={s.label} gap={8}>
            <span style={{ color: s.color }}>●</span>
            <span>
              {s.label} <b>{s.yHTML}</b> ºC
            </span>
          </Flex>
        ))}
    </div>
  )}
  renderTitle={<Typography.Title level={5}>Temperatura</Typography.Title>}
/>;
```

Notes:

- Set a non-empty `options.title` / `xlabel` / … when using the matching `render*` prop so the core still creates the label div (a space is enough).
- `axisLabelFormatter` and `valueFormatter` stay **strings** (tick labels use `textContent`). Pass them via `options`.
- Annotation `shortText` is also text-only for now.
- `render*` uses `react-dom/client` (`createRoot`). Prefer **React 18+** for these props; the rest of the wrapper still works on React 17.

## Theming

```tsx
import { themes } from "react-zpgraph"; // re-export from zpgraph

// Or pass theme prop — preferred for React apps:
<Zpgraph data={data} theme="dark" options={{ tooltip: { show: "always" } }} />;
```

- **DOM** (legend, axis labels, annotations): CSS variables on `.zpgraph` (`--zp-legend-bg`, …). Activated by `data-theme="dark"` on the chart or an ancestor.
- **Canvas** (grid, axes, highlight, range selector): `themes.light` / `themes.dark` option presets.
- **Series `colors`**: still owned by the app — theme does not change them.

Override layout tokens without rewriting rules:

```css
.zpgraph {
  --zp-legend-padding: 0.7rem 1rem;
  --zp-legend-radius: 4px;
  --zp-axis-label-font-size: 12px;
  --zp-axis-label-opacity: 0.8;
}
```

Or pass Tailwind utilities:

```tsx
<Zpgraph
  data={data}
  theme="dark"
  classNames={{
    legend: "rounded-md p-3 shadow-lg",
    axisLabel: "text-xs opacity-80",
  }}
/>
```

Override a single chrome color while keeping the rest of the theme:

```tsx
<Zpgraph theme="dark" options={{ gridLineColor: "rgb(255,0,0)" }} data={data} />
```

## Imperative handle

```ts
ref.current?.getInstance();           // Zpgraph | null
ref.current?.updateOptions({ ... });  // e.g. visibility
ref.current?.resize();
ref.current?.destroy();               // usually unnecessary — unmount destroys
```

Use the handle for zoom buttons, series toggles, or any API not expressed as props.
`setBrushActive` / `clearMeasure` control extras when those props are enabled.

## Extras props

Plugin extras attach on **first mount** (same lifecycle as core `plugins`).
Mutable bits (`locale`, `brushActive`, `spanBands`, callbacks, plotters) sync on
rerender.

```tsx
<Zpgraph
  data={data}
  zoomLimits={{ minSpanMs: 3_600_000 }}
  keyboard
  locale="pt"
  measure
  onMeasure={(r) => console.log(r.deltaX, r.deltaY)}
  brushSelect
  brushActive={brushOn}
  onBrushSelect={({ xRange }) => setRange(xRange)}
  spanBands={[{ x0, x1, color: "rgba(0,143,251,0.6)", label: "Auto" }]}
  movingAverage={{ period: 7 }}
  fillBetween={{ seriesA: "Low", seriesB: "High" }}
/>
```

## License

MIT — see [LICENSE](./LICENSE).
