import { describe, expect, it } from "vitest";
import * as core from "zpgraph";
import * as extras from "zpgraph/extras";
import * as react from "../src/index";
import * as reactExtras from "../src/extras";

describe("react-zpgraph reexports zpgraph", () => {
  it("exposes every core value export", () => {
    for (const key of Object.keys(core)) {
      if (key === "default" || key === "Zpgraph") {
        continue;
      }
      expect(key in react, key).toBe(true);
    }
    expect(react.ZpgraphCore).toBe(core.Zpgraph);
  });

  it("exposes every extras export", () => {
    for (const key of Object.keys(extras)) {
      expect(key in reactExtras, key).toBe(true);
    }
  });
});
