import { h } from "../dom.js";
import { tr } from "../i18n.js";

const sections = [
  {
    title: ["自然图鉴", "Field atlas"],
    groups: [
      {
        title: ["物种与谱系", "Species and lineage"],
        modules: [
          ["物种探索", "Explore", "#/explore", "检索物种档案、分类信息与亲缘关系。", "Search species records, taxonomy and relationships."],
          ["进化树", "Evolution tree", "#/tree", "浏览 BioAtlas 自有主树，展开分类层级与分歧年代。", "Browse the curated BioAtlas tree, taxonomic ranks and divergence times."]
        ]
      },
      {
        title: ["目的地与季节", "Places and seasons"],
        modules: [
          ["旅行场景", "Travel scenes", "#/regions", "按目的地查看已收录的自然观察场景。", "Browse documented nature-observation scenes by destination."],
          ["自然地图", "Nature map", "#/map", "在地图上定位已收录的观察场景。", "Locate documented observation scenes on a map."],
          ["季节日历", "Seasonality", "#/seasonality", "按月份浏览物种与场景的观察窗口。", "Browse observation windows by month."]
        ]
      },
      {
        title: ["观察与行程", "Fieldwork and trips"],
        modules: [
          ["野外辨认", "Field identification", "#/identify", "按名称、栖息地、地区和形态线索查找物种。", "Find species by name, habitat, region and field marks."],
          ["保护与礼仪", "Conservation and ethics", "#/conservation", "查看保护评估、法律保护和低干扰观察提示。", "Review conservation assessments, legal protections and low-impact field guidance."],
          ["自然声音", "Nature sounds", "#/sounds", "浏览具备明确来源与授权信息的自然录音。", "Browse nature recordings with documented sources and licenses."],
          ["行程工作台", "Trip workbench", "#/planner", "按目的地与月份整理观察清单和行程。", "Organize observation checklists and trips by place and month."]
        ]
      }
    ]
  },
  {
    title: ["科学与平台", "Science and platform"],
    groups: [
      {
        title: ["科学依据", "Scientific references"],
        modules: [
          ["科学来源", "Scientific sources", "#/sources", "检索图鉴使用的文献、数据库与分类权威。", "Search literature, databases and taxonomic authorities used by the atlas."]
        ]
      },
      {
        title: ["数据治理", "Data governance"],
        modules: [
          ["数据质量", "Data quality", "#/quality", "检查数据覆盖、来源追溯和审核状态。", "Review data coverage, provenance and review status."]
        ]
      },
      {
        title: ["开发与协作", "Development and collaboration"],
        modules: [
          ["开发说明书", "Developer documentation", "#/docs", "查看平台架构、API 契约、数据模型与贡献规范。", "Read platform architecture, API contracts, data models and contribution guidelines."]
        ]
      }
    ]
  }
];

export function moduleDirectory(root, compact = false) {
  root.append(
    h("section", { class: "module-directory block", "aria-labelledby": "module-directory-title" },
      h("header", { class: "module-directory-head" },
        h("div", null,
          h("p", { class: "eyebrow" }, tr("完整功能目录", "Complete module directory")),
          h("h2", { id: "module-directory-title" }, tr("所有模块，一览可达", "Every module, visible at a glance")),
          h("p", { class: "muted" }, tr("按用途分层排列；所有入口同时列示，无需拖拽或横向滑动。", "Grouped by purpose. Every entry is listed without dragging or horizontal scrolling."))),
        compact ? h("a", { class: "btn small", href: "#/modules" }, tr("独立查看目录", "Open full directory")) : null),
      sections.map((section, index) =>
        h("section", { class: "module-level", "aria-labelledby": `module-level-${index}` },
          h("h3", { id: `module-level-${index}`, class: "module-level-title" }, section.title[0] && tr(section.title[0], section.title[1])),
          section.groups.map((group) =>
            h("section", { class: "module-group" },
              h("h4", null, tr(group.title[0], group.title[1])),
              h("div", { class: "module-links" },
                group.modules.map((item) =>
                  h("a", { class: "module-link", href: item[2] },
                    h("span", { class: "module-link-copy" },
                      h("b", null, tr(item[0], item[1])),
                      h("span", null, tr(item[3], item[4]))),
                    h("span", { class: "module-link-arrow", "aria-hidden": "true" }, "↗")))))))))
  );
}

export function modulesView(root) {
  moduleDirectory(root, false);
}
