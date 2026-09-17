/**
 * @license
 * Copyright (c) 2026 João Vitor Zeppe (zeppejoaovitor@gmail.com)
 * MIT-licensed: https://opensource.org/license/MIT
 */

import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import ZpgraphCore, { themes } from "zpgraph";
import type {
  ChartClassNames,
  ChartTheme,
  LegendData,
  ZpgraphOptions,
} from "zpgraph";
import type ZpgraphInstance from "zpgraph";
import { createReactHost, resolveNode, type ReactHost } from "./react-host";
import type { LabelRender, ZpgraphHandle, ZpgraphProps } from "./types";

type RenderSlots = {
  renderLegend?: ZpgraphProps["renderLegend"];
  renderTitle?: LabelRender;
  renderXLabel?: LabelRender;
  renderYLabel?: LabelRender;
  renderY2Label?: LabelRender;
};

const LABEL_SLOTS: Array<{
  key: keyof Omit<RenderSlots, "renderLegend">;
  selector: string;
}> = [
  { key: "renderTitle", selector: ".zpgraph-title" },
  { key: "renderXLabel", selector: ".zpgraph-xlabel" },
  { key: "renderYLabel", selector: ".zpgraph-ylabel" },
  { key: "renderY2Label", selector: ".zpgraph-y2label" },
];

const mergeOptions = (
  theme: ChartTheme | undefined,
  classNames: ChartClassNames | undefined,
  options: Partial<ZpgraphOptions> | undefined,
  slots: RenderSlots,
  hosts: {
    legend?: ReactHost;
    labels: Partial<
      Record<(typeof LABEL_SLOTS)[number]["key"], ReactHost>
    >;
  },
): Partial<ZpgraphOptions> | undefined => {
  const hasSlots =
    !!slots.renderLegend ||
    !!slots.renderTitle ||
    !!slots.renderXLabel ||
    !!slots.renderYLabel ||
    !!slots.renderY2Label;

  if (!theme && !classNames && options === undefined && !hasSlots) {
    return undefined;
  }

  const merged: Partial<ZpgraphOptions> = { ...options };
  if (classNames) {
    merged.classNames = { ...options?.classNames, ...classNames };
  }

  if (slots.renderLegend && hosts.legend) {
    const host = hosts.legend;
    const renderLegend = slots.renderLegend;
    merged.legendFormatter = (data: LegendData) => {
      host.render(renderLegend(data));
      return host.element;
    };
  }

  const needsLabelPortal = LABEL_SLOTS.some(({ key }) => slots[key]);
  if (needsLabelPortal) {
    const userDraw = options?.drawCallback;
    merged.drawCallback = (g: ZpgraphInstance, isInitial: boolean) => {
      for (const { key, selector } of LABEL_SLOTS) {
        const slot = slots[key];
        if (!slot) continue;
        const target = g.graphDiv.querySelector(selector);
        if (!target) continue;

        let host = hosts.labels[key];
        if (!host) {
          host = createReactHost();
          hosts.labels[key] = host;
        }
        if (host.element.parentElement !== target) {
          target.replaceChildren(host.element);
        }
        const node = resolveNode(slot);
        if (node !== undefined) host.render(node);
      }
      userDraw?.(g, isInitial);
    };
  }

  if (!theme) return merged;
  return { ...themes[theme], ...merged, theme };
};

/**
 * Thin React wrapper around zpgraph.
 * One ctor on mount; data/options/theme flow through updateOptions (no recreate).
 */
export const Zpgraph = forwardRef<ZpgraphHandle, ZpgraphProps>(
  function Zpgraph(
    {
      data,
      options,
      theme,
      classNames,
      className,
      style,
      onReady,
      renderLegend,
      renderTitle,
      renderXLabel,
      renderYLabel,
      renderY2Label,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<ZpgraphCore | null>(null);
    const dataRef = useRef(data);
    const optionsRef = useRef(options);
    const themeRef = useRef(theme);
    const classNamesRef = useRef(classNames);
    const renderLegendRef = useRef(renderLegend);
    const renderTitleRef = useRef(renderTitle);
    const renderXLabelRef = useRef(renderXLabel);
    const renderYLabelRef = useRef(renderYLabel);
    const renderY2LabelRef = useRef(renderY2Label);
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;

    const legendHostRef = useRef<ReactHost | null>(null);
    const labelHostsRef = useRef<
      Partial<Record<(typeof LABEL_SLOTS)[number]["key"], ReactHost>>
    >({});

    const currentSlots = (): RenderSlots => ({
      renderLegend: renderLegendRef.current,
      renderTitle: renderTitleRef.current,
      renderXLabel: renderXLabelRef.current,
      renderYLabel: renderYLabelRef.current,
      renderY2Label: renderY2LabelRef.current,
    });

    useImperativeHandle(ref, () => ({
      getInstance: () => instanceRef.current,
      updateOptions: (opts, blockRedraw) => {
        instanceRef.current?.updateOptions(opts, blockRedraw);
      },
      resize: () => {
        instanceRef.current?.resize();
      },
      destroy: () => {
        instanceRef.current?.destroy();
        instanceRef.current = null;
      },
    }));

    useLayoutEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      if (renderLegendRef.current && !legendHostRef.current) {
        legendHostRef.current = createReactHost();
      }

      const hosts: {
        legend?: ReactHost;
        labels: Partial<
          Record<(typeof LABEL_SLOTS)[number]["key"], ReactHost>
        >;
      } = { labels: labelHostsRef.current };
      if (legendHostRef.current) hosts.legend = legendHostRef.current;

      const g = new ZpgraphCore(
        el,
        dataRef.current,
        mergeOptions(
          themeRef.current,
          classNamesRef.current,
          optionsRef.current,
          currentSlots(),
          hosts,
        ),
      );
      instanceRef.current = g;
      onReadyRef.current?.(g);

      let ro: ResizeObserver | undefined;
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => {
          instanceRef.current?.resize();
        });
        ro.observe(el);
      }

      return () => {
        ro?.disconnect();
        g.destroy();
        if (instanceRef.current === g) {
          instanceRef.current = null;
        }
        legendHostRef.current?.dispose();
        legendHostRef.current = null;
        for (const host of Object.values(labelHostsRef.current)) {
          host?.dispose();
        }
        labelHostsRef.current = {};
      };
    }, []);

    useLayoutEffect(() => {
      if (dataRef.current === data) return;
      dataRef.current = data;
      instanceRef.current?.updateOptions({ file: data });
    }, [data]);

    useLayoutEffect(() => {
      const themeChanged = themeRef.current !== theme;
      const optionsChanged = optionsRef.current !== options;
      const classNamesChanged = classNamesRef.current !== classNames;
      const slotsChanged =
        renderLegendRef.current !== renderLegend ||
        renderTitleRef.current !== renderTitle ||
        renderXLabelRef.current !== renderXLabel ||
        renderYLabelRef.current !== renderYLabel ||
        renderY2LabelRef.current !== renderY2Label;

      if (
        !themeChanged &&
        !optionsChanged &&
        !classNamesChanged &&
        !slotsChanged
      ) {
        return;
      }

      themeRef.current = theme;
      optionsRef.current = options;
      classNamesRef.current = classNames;
      renderLegendRef.current = renderLegend;
      renderTitleRef.current = renderTitle;
      renderXLabelRef.current = renderXLabel;
      renderYLabelRef.current = renderYLabel;
      renderY2LabelRef.current = renderY2Label;

      if (renderLegend && !legendHostRef.current) {
        legendHostRef.current = createReactHost();
      }

      const hosts: {
        legend?: ReactHost;
        labels: Partial<
          Record<(typeof LABEL_SLOTS)[number]["key"], ReactHost>
        >;
      } = { labels: labelHostsRef.current };
      if (legendHostRef.current) hosts.legend = legendHostRef.current;

      const merged = mergeOptions(
        theme,
        classNames,
        options,
        currentSlots(),
        hosts,
      );
      if (merged !== undefined) {
        instanceRef.current?.updateOptions(merged);
      }
    }, [
      theme,
      options,
      classNames,
      renderLegend,
      renderTitle,
      renderXLabel,
      renderYLabel,
      renderY2Label,
    ]);

    return (
      <div
        ref={containerRef}
        className={className}
        style={style}
        {...(theme ? { "data-theme": theme } : {})}
      />
    );
  },
);
