# UI 开发

界面位于 `ui/`，是**无构建步骤**的原生 ES 模块：没有打包器，没有框架，没有依赖。

## 边界

- 只通过 `ui/js/api.js` 访问数据；其他文件不要 `fetch`。
- 不要读取或引用 `data/`、`schema/`、`tools/`（`npm run check` 会拦截）。
- 依赖的只有[API 契约 v1](api-contract.md) 中 `required` 的字段。

## 目录

| 路径 | 作用 |
| --- | --- |
| `ui/index.html` | 入口 |
| `ui/config.js` | `apiBase`、`docsBase`、仓库地址 |
| `ui/css/bioatlas.css` | 全部样式；颜色是 CSS 变量，含深色主题 |
| `ui/js/app.js` | 外壳、路由、主题与语言切换 |
| `ui/js/api.js` | **唯一**取数模块 |
| `ui/js/views/*.js` | 各页面：首页、探索、物种、分类单元、系统树、场景、工作台、文档 |
| `ui/js/viz.js` | 数据驱动的图形：谱系徽记、月份轮、柱图 |
| `ui/js/tree-layout.js` | 系统树布局与渲染，也供工作台使用 |
| `ui/js/md.js` | 安全的 Markdown 渲染（构建 DOM，不用 innerHTML） |
| `ui/js/labels.js` | 枚举值的中英文标签（未知值降级显示原值） |

## 开发流程

```bash
npm run build:api     # 先得到一份 API（或用 ?api= 指向别处）
npm run build:ui
npm run serve
```

只改 UI 时，不需要懂数据细节：把 `apiBase` 指向任意符合契约的 API 即可。

## 设计约定

- **视觉：**“野外笔记”风格，纸色背景、墨绿（植物）与赤陶（动物）；衬线标题、无衬线正文。所有颜色都是 `:root` 变量，在深色主题下重定义。
- **没有照片也要好看：**每个物种有“谱系徽记”（每圈 = 一个祖先类群）与月份轮，由数据生成；有 `media` 时才显示照片。
- **可读性：**正文 ≥ 16px，行高 1.7；对比度满足 WCAG AA；支持键盘与 `prefers-reduced-motion`。
- **安全：**所有来自数据的文本都走 `h()` / `textContent`；链接只接受 `http(s)`。
- **新增页面：**在 `app.js` 的 `routes` 加一行，写一个 `views/xxx.js` 导出 `(root, {params, query}) => Promise`。
- **新增文案：**界面文案用 `tr("中文", "English")`；数据文本用 `loc(obj)`。

## 替换整个界面

只要它读取 `api/v1`，就可以完全替换 `ui/`（例如 React、Svelte 或原生应用）。保持 `docs/` 的内置入口与对 `llms.txt` 的链接即可。
