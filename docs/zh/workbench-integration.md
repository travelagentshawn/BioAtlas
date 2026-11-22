# 对接旅行工作台

图鉴与旅行规划之间有三条通道，都不需要后端。

## 1. 内置的行程工作台（`#/planner`）

选择月份与目的地/场景，得到：可勾选的观察清单（当季优先）、统计、以及“这次旅行的系统发育树”。状态保存在浏览器本地（`localStorage`）。

## 2. 深链接

外部页面可以直接打开工作台并带上参数：

```text
#/planner?regions=nara-park-japan,urban-park-ponds-east-asia&month=11
#/planner?lat=34.69&lng=135.84&r=30&month=11
```

| 参数 | 含义 |
| --- | --- |
| `regions` | 逗号分隔的场景 id |
| `month` | 1–12 |
| `lat`、`lng`、`r` | 坐标与半径（km）：加入中心点落在范围内（含场景自身半径）的目的地 |

## 3. 交换文件（`bioatlas-trip`）

工作台可以导出/导入 JSON，格式见 [`schema/trip.schema.json`](repo:schema/trip.schema.json)：

```json
{
  "type": "bioatlas-trip",
  "format_version": 1,
  "name": "京都 · 11 月赏秋",
  "month": 11,
  "regions": ["temple-garden-east-asia"],
  "destinations": [{ "name": "奈良", "lat": 34.685, "lng": 135.843, "radius_km": 20 }],
  "checked": []
}
```

任何外部行程软件（或 AI）只要生成这个文件，就可以在“行程工作台 → 导入”打开。也可以导出 Markdown 清单用于笔记应用。

## 给旅行工作台开发者的建议

- 把行程中的每个地点转成 `destinations[]`（坐标 + 半径 + 日期），导入后 BioAtlas 会匹配附近的场景。
- 不要自己缓存数据：每次读取 `api/v1/manifest.json` 的 `data_hash`，变化时再刷新。
- 想要新的接口（例如按坐标直接返回物种）？提交契约变更，见[API 契约](api-contract.md)。
- 数据中还没有你的目的地？新增一个 `data/regions/<id>.json` 即可，见[贡献数据](contributing-data.md)。
