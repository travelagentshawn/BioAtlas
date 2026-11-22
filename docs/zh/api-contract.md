# API 契约 v1

API 是一组**静态 JSON 文件**，没有服务端逻辑。基地址默认为站点下的 `api/v1/`。形状定义在 [`contract/api-v1.schema.json`](repo:contract/api-v1.schema.json)，端点清单在 [`contract/endpoints.json`](repo:contract/endpoints.json)，编译器每次都会按它们校验输出。

## 端点

| 路径 | 形状 | 说明 |
| --- | --- | --- |
| `manifest.json` | Manifest | 入口：版本、数据哈希、数量、端点表 |
| `tree.json` | TreeNode | 整棵系统树（嵌套），物种挂在所属分类单元 |
| `taxa.json` | TaxonLite[] | 所有分类单元（平铺） |
| `taxa/{id}.json` | Taxon | 单个单元：谱系、子类群、物种、文献 |
| `species.json` | SpeciesLite[] | 所有物种（轻量） |
| `species/{id}.json` | Species | 完整物种：谱系、出现的场景、最近亲缘、文献 |
| `regions.json` | RegionLite[] | 所有场景（轻量） |
| `regions/{id}.json` | Region | 单个场景：物种、每月物种数 |
| `calendar.json` | Calendar | 月份 → 物种 id（按最佳月份） |
| `sources.json` | Source[] | 全部文献 |
| `search.json` | SearchIndex | 客户端搜索索引 |

另外，编译器会把 `schema/` 与 `contract/` 复制到 `api/v1/schema/` 与 `api/v1/contract/`，任何客户端或 AI 都可以直接取到。

## 约定

- **多语言文本**是 `{ "zh": "...", "en": "..." }`，两种语言都必有；界面可对缺失语言降级。
- **月份**是整数 1–12。
- **年龄**是 `{ estimate, min, max, confidence, source }`，单位百万年。
- 所有 `*_resolved` 数组已经把 id 展开为完整对象，客户端不需要再发请求。
- `relatives`：物种按“最近共同祖先（MRCA）越年轻越靠前”排序，每项带 `mrca` 分类单元。
- 响应里允许出现契约之外的**额外字段**；客户端应忽略不认识的字段。

## 例子

```bash
curl -s https://<站点>/api/v1/manifest.json
curl -s https://<站点>/api/v1/species/ginkgo-biloba.json
```

## 修改契约

1. 先读[三层解耦架构](architecture.md)的兼容性规则。
2. 同一个 PR 内更新：`contract/api-v1.schema.json`（及必要时 `endpoints.json`）、`tools/build-api.mjs`、本页。
3. 在 PR 描述里写明“界面方需要做什么”。新增可选字段不需要界面方立即行动。
4. 运行 `npm run check`。
