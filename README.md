# react-zpgraph

React bindings for [zpgraph](https://www.npmjs.com/package/zpgraph) — fast,
typed timeseries charts. Thin wrapper: one chart instance per mount, updates
via `updateOptions`, auto-resize with `ResizeObserver`.

Works with **React 19** (primary) and **React 18**.

## Install

```bash
npm install react-zpgraph zpgraph
```

Styles live in the core package (not bundled here):

```ts
import "zpgraph/style.css";
```

## Quick start

```tsx
import { useRef } from "react";
import { Zpgraph, type ZpgraphHandle } from "react-zpgraph";
import "zpgraph/style.css";

const data = [
  [new Date("2024-01-01"), 10, 20],
  [new Date("2024-01-02"), 12, 18],
];

export function Chart() {
  const ref = useRef<ZpgraphHandle>(null);

  return (
    <>
      <button type="button" onClick={() => ref.current?.getInstance()?.resetZoom()}>
        Reset zoom
      </button>
      <Zpgraph
        ref={ref}
        data={data}
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
| `options` | `Partial<ZpgraphOptions>` (without `file`). Compared by reference. |
| `className` / `style` | Applied to the container `div`. |
| `onReady` | Called once after construction with the chart instance. |
| `ref` | `ZpgraphHandle` for imperative access. |

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
react ^18 || ^19
react-dom ^18 || ^19
zpgraph ^0.1.0
```

## License

MIT — see [LICENSE](./LICENSE).
