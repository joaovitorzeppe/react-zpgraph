# Changes

## 1.0.0

- Depends on `zpgraph` ^1.4.0 instead of a peer dependency
- Reexports the core package, including `react-zpgraph/extras`
- React 18+ only
- Shortcut props register opt-in plugins
- Shallow compare for `options`
- Measure label render receives the real result

## 0.6.1

- Build: `tsdown` only (drop `tsc` emit + `fix-dts-extensions`)
- No source maps / declaration maps in the package
- Types come from tsdown’s bundled `index.d.ts`

## 0.6.0

- Peer/dev dependency `zpgraph` ^1.3.0
- Type-aware oxlint: drop unsafe assertions; lint script + `.oxlintrc.json`
- Safer extras/react-host bridges (guards instead of casts)

## 0.5.1

- Package checks: `publint` + `attw` (`npm run check:pkg`)
- Emit `.d.ts` with `.js` relative import extensions (Node16 ESM)

## 0.5.0

- Re-export core types and `ZpgraphCore` from `react-zpgraph`
- Demo tab **Interaction** — custom model via `ZpgraphCore.defaultInteractionModel`

## 0.4.0

- ESM-only package (dropped CJS build)

## 0.3.0

- More customization added to labels
- Dropped `fullscreen` / `renderFullscreenButton` (use page layout)
- Peer/dev dependency `zpgraph` ^1.1.0 (extras + CSS tokens)

## 0.2.0

- Wire core extras as React props (`zoomLimits`, `keyboard`, `measure`,
  `brushSelect`, `urlSync`, `locale`, `spanBands`,
  `movingAverage`, `fillBetween`) via `extras-bridge`
- Handle helpers: `setBrushActive`, `clearMeasure`
- Demo tab **Extras** + README section

## 0.1.0

- Initial Zpgraph release candidate based on dygraphs 2.2.3-alpha sources.
