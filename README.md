# react-zpgraph

React bindings for [zpgraph](https://www.npmjs.com/package/zpgraph) — fast,
typed timeseries charts. Thin wrapper: one chart instance per mount, updates
via `updateOptions`, auto-resize with `ResizeObserver`.

Works with **React 19** (primary), **React 18**, and **React 17**.

## Install

```bash
npm install react-zpgraph zpgraph
```

Styles live in the core package (not bundled here) — required for theme tokens:

```ts
import "zpgraph/style.css";
```

## Demos

Interactive gallery (basic, theme, `renderLegend`, two axes, range selector,
imperative ref, classNames, live update):

```bash
npm run demo
```

Opens Vite on port 5174. Source under [`demos/`](./demos).

## Quick start

```tsx
import { useRef } from "react";
import { Zpgraph, type ZpgraphHandle } from "react-zpgraph";
import "zpgraph/style.css";

const data = [
  [new Date("2024-01-01"), 10, 20],
  [new Date("2024-01-02"), 12, 18],
];

export function Chart({ isDark }: { isDark: boolean }) {
  const ref = useRef<ZpgraphHandle>(null);

  return (
    <>
      <button type="button" onClick={() => ref.current?.getInstance()?.resetZoom()}>
        Reset zoom
      </button>
      <Zpgraph
        ref={ref}
        data={data}
        theme={isDark ? "dark" : "light"}
        options={{
          labels: ["Date", "Alpha", "Beta"],
          legend: "always",
          animatedZooms: true,
        }}
        style={{ width: "100%", height: 320 }}
      />
    </>
  );
}
```

## Props

| Prop | Description |
|------|-------------|
| `data` | Chart series (`Data`). Changes call `updateOptions({ file })` — no destroy/recreate. |
| `options` | `Partial<ZpgraphOptions>` (without `file`). Compared by reference. User keys win over theme presets. |
| `theme` | `"light"` \| `"dark"`. Sets `data-theme` on the wrapper and merges canvas chrome from `themes`. |
| `classNames` | Extra classes on DOM nodes (`legend`, `axisLabel`, `title`, …). Merged into `options.classNames`. |
| `className` / `style` | Applied to the container `div`. |
| `onReady` | Called once after construction with the chart instance. |
| `ref` | `ZpgraphHandle` for imperative access. |
| `renderLegend` | `(data) => ReactNode`. Wins over `options.legendFormatter`. |
| `renderTitle` / `renderXLabel` / `renderYLabel` / `renderY2Label` | `ReactNode` or `() => ReactNode`, portaled into chart label divs. |

## React render props

Use React components (Ant Design, etc.) for the legend and chart labels.
These props exist only on `react-zpgraph` — the core stays DOM/HTML.

```tsx
import { Typography, Flex } from "antd";
import { Zpgraph } from "react-zpgraph";

<Zpgraph
  data={data}
  options={{ labels: ["Date", "Alpha"], legend: "follow", title: " " }}
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
/>
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
<Zpgraph data={data} theme="dark" options={{ legend: "always" }} />
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

## Performance notes

- **Do not** destroy and recreate the chart when data changes. Pass a new `data` prop; the wrapper updates `file` in place.
- Keep `options` stable when callbacks inside it are expensive (`useCallback` / hoist). A new `options` object reference triggers `updateOptions` and a redraw.
- Container size changes call `resize()` — cheaper than rebuilding the chart.
- Large series stay efficient: zpgraph still owns decimation and canvas rendering.

## Peer dependencies

```
react ^17 || ^18 || ^19
react-dom ^17 || ^18 || ^19
zpgraph ^0.1.0
```

## License

MIT — see [LICENSE](./LICENSE).
