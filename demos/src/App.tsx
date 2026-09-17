import { useMemo, useState } from "react";
import { BasicDemo } from "./BasicDemo";
import { ThemeDemo } from "./ThemeDemo";
import { RenderLegendDemo } from "./RenderLegendDemo";
import { TwoAxesDemo } from "./TwoAxesDemo";
import { RangeDemo } from "./RangeDemo";
import { RefControlsDemo } from "./RefControlsDemo";
import { ClassNamesDemo } from "./ClassNamesDemo";
import { LiveDemo } from "./LiveDemo";
import { ChartFeaturesDemo } from "./ChartFeaturesDemo";

const TABS = [
  { id: "basic", label: "Basic", view: BasicDemo },
  { id: "theme", label: "Theme", view: ThemeDemo },
  { id: "legend", label: "renderLegend", view: RenderLegendDemo },
  { id: "axes", label: "Two axes", view: TwoAxesDemo },
  { id: "range", label: "Range", view: RangeDemo },
  { id: "ref", label: "Ref / zoom", view: RefControlsDemo },
  { id: "classNames", label: "classNames", view: ClassNamesDemo },
  { id: "live", label: "Live", view: LiveDemo },
  { id: "features", label: "Features", view: ChartFeaturesDemo },
] as const;

type TabId = (typeof TABS)[number]["id"];

export const App = () => {
  const [tab, setTab] = useState<TabId>("basic");
  const Active = useMemo(
    () => TABS.find((t) => t.id === tab)?.view ?? BasicDemo,
    [tab],
  );

  return (
    <>
      <h1>react-zpgraph</h1>
      <p className="lede">
        Interactive demos of the React bindings. Run <code>npm run demo</code>{" "}
        from the package root.
      </p>
      <nav className="tabs" aria-label="Demos">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === tab ? "active" : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <Active />
    </>
  );
};
