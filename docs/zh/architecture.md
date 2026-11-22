# 三层解耦架构

```text
 data/ + schema/ ──(tools/build-api)──▶ dist/api/v1/*.json ◀──(fetch)── ui/
                                              ▲
                                  contract/ (形状与端点清单)
```

三层只通过**契约**相连：

| 层 | 目录 | 输入 | 输出 | 禁止 |
| --- | --- | --- | --- | --- |
| 数据层 | `data/`、`schema/`、`tools/` | 人或 AI 编写的 JSON | `dist/api/v1/` | 读取 `ui/` |
| 契约层 | `contract/` | — | 响应形状（JSON Schema）与端点清单 | — |
| 界面层 | `ui/` | `api/v1` 的 HTTP 响应 | 网页 | 读取 `data/`、`schema/`、`tools/` |

## 为什么这样分

- 一个 AI 可以只做界面，另一个只做数据，互不阻塞：界面方用任何一份符合契约的 API 都能开发；数据方只要契约检查通过就不会破坏界面。
- 界面可以被整体替换（例如换成 React 版本或移动应用），数据完全不受影响。
- API 可以托管在别处：改 `ui/config.js` 的 `apiBase`，或在地址后加 `?api=https://example.org/api/v1`。

## 如何强制执行

- `tools/build-api.mjs` 编译后会**逐个文件**按 `contract/` 校验输出，并拒绝未在 `endpoints.json` 声明的文件。
- `tools/check-boundaries.mjs` 检查 `ui/` 没有读取数据目录、数据侧没有引用 `ui/`。
- `npm run check` 在 CI 中同时运行以上检查。

## 兼容性规则（SemVer）

- v1 内**允许**：新增可选字段、新增端点、新增枚举值（界面必须对未知枚举值降级显示，见 `ui/js/labels.js`）。
- v1 内**禁止**：删除或重命名字段、改变类型。这需要发布 v2，并让 `api/v2/` 与 `api/v1/` 并存一段时间。
- 契约变更必须在同一个 PR 中同时更新 `contract/`、编译器输出、`docs/*/api-contract.md`，并注明由谁来调整界面。
