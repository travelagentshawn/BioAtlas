# 快速开始

只需要 **Node.js 20 或更新版本**。项目没有任何第三方依赖，不需要 `npm install`。

## 本地运行

```bash
git clone https://github.com/travelagentshawn/BioAtlas.git
cd BioAtlas
npm run dev        # 校验 + 编译 + 在 http://localhost:8080 提供服务
```

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run validate` | 用 `schema/` 校验全部数据并检查交叉引用 |
| `npm run build:api` | **数据方**：只编译 `dist/api/v1`，不碰 `ui/` |
| `npm run build:ui` | **界面方**：只把 `ui/` 复制到 `dist/`，不读 `data/` |
| `npm run build:docs` | 复制说明书并检查导航文件 |
| `npm run build` | 以上全部 |
| `npm run serve` | 静态服务 `dist/` |
| `npm run check` | CI 使用：校验 + 边界检查 + 编译 + 测试 |

## 直接读取数据（不需要运行任何东西）

数据就是文件。例如：

```bash
cat data/species/ginkgo-biloba.json
```

或者在编译后读取 API：

- [`manifest.json`](api:manifest.json)：入口，列出全部端点与数量
- [`species.json`](api:species.json)：所有物种的轻量列表
- [`tree.json`](api:tree.json)：整棵系统树

## 新增一个物种（五分钟）

1. 复制 `data/species/ginkgo-biloba.json` 为 `data/species/<学名-连字符>.json`。
2. 修改内容；`id` 必须等于文件名，`taxon` 必须是已有的分类单元 id。
3. 所有引用的文献必须存在于 `data/sources/`。
4. 把它加入至少一个 `data/regions/*.json` 的 `species` 列表。
5. `npm run validate`，通过后提交。

详细规范见[贡献数据与科学规范](contributing-data.md)。
