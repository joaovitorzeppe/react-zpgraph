/**
 * @license
 * Copyright (c) 2026 João Vitor Zeppe (zeppejoaovitor@gmail.com)
 * MIT-licensed: https://opensource.org/license/MIT
 */

import type { ReactNode } from "react";
import type { ThresholdBand } from "zpgraph";
import type { SpanBand } from "zpgraph/extras/span-bands";
import type { MeasureResult } from "zpgraph/extras/measure";
import { createReactHost, type ReactHost } from "./react-host";

export type DynamicLabelRenders = {
  renderThresholdLabel?:
    | ((band: ThresholdBand, index: number) => ReactNode)
    | undefined;
  renderSpanBandLabel?:
    | ((band: SpanBand, index: number) => ReactNode)
    | undefined;
  renderMeasureLabel?:
    | ((info: {
        result: MeasureResult | null;
        dx: string;
        dy: string;
      }) => ReactNode)
    | undefined;
};

/** Portal React nodes into core DOM label hosts (`[data-zp-label]`). */
export const paintDynamicLabels = (
  graphDiv: HTMLElement,
  renders: DynamicLabelRenders,
  hosts: {
    threshold: ReactHost[];
    spanBand: ReactHost[];
    measure: ReactHost | null;
  },
  thresholds: ThresholdBand[] | undefined,
  spanBands: SpanBand[] | undefined,
): void => {
  if (renders.renderThresholdLabel) {
    const els = graphDiv.querySelectorAll<HTMLElement>(
      '[data-zp-label="threshold"]',
    );
    const labeled = (thresholds ?? []).filter((b) => b.label);
    const renderThreshold = renders.renderThresholdLabel;
    els.forEach((el, i) => {
      const band = labeled[i];
      if (!band) {
        return;
      }
      let host = hosts.threshold[i];
      if (!host) {
        host = createReactHost();
        hosts.threshold[i] = host;
      }
      if (host.element.parentElement !== el) {
        el.replaceChildren(host.element);
      }
      host.render(renderThreshold(band, i));
    });
  }

  if (renders.renderSpanBandLabel) {
    const els = graphDiv.querySelectorAll<HTMLElement>(
      '[data-zp-label="span-band"]',
    );
    const labeled = (spanBands ?? []).filter((b) => b.label);
    const renderSpan = renders.renderSpanBandLabel;
    els.forEach((el, i) => {
      const band = labeled[i];
      if (!band) {
        return;
      }
      let host = hosts.spanBand[i];
      if (!host) {
        host = createReactHost();
        hosts.spanBand[i] = host;
      }
      if (host.element.parentElement !== el) {
        el.replaceChildren(host.element);
      }
      host.render(renderSpan(band, i));
    });
  }

  if (renders.renderMeasureLabel) {
    const el = graphDiv.querySelector<HTMLElement>('[data-zp-label="measure"]');
    if (el && el.style.display !== "none") {
      if (!hosts.measure) {
        hosts.measure = createReactHost();
      }
      const host = hosts.measure;
      if (host.element.parentElement !== el) {
        el.replaceChildren(host.element);
      }
      host.render(
        renders.renderMeasureLabel({
          result: null,
          dx: el.dataset.zpDx ?? "",
          dy: el.dataset.zpDy ?? "",
        }),
      );
    }
  }
};

export const disposeDynamicLabelHosts = (hosts: {
  threshold: ReactHost[];
  spanBand: ReactHost[];
  measure: ReactHost | null;
}): void => {
  for (const h of hosts.threshold) {
    h.dispose();
  }
  for (const h of hosts.spanBand) {
    h.dispose();
  }
  hosts.measure?.dispose();
  hosts.threshold.length = 0;
  hosts.spanBand.length = 0;
  hosts.measure = null;
};
