# 数据模型

四类记录，每类一个目录、一个 JSON Schema、**一个文件一条记录**，文件名 = `id` + `.json`。

| 目录 | Schema | 说明 |
| --- | --- | --- |
| `data/taxa/` | [`schema/taxon.schema.json`](repo:schema/taxon.schema.json) | 系统树的节点：演化支、目、科… |
| `data/species/` | [`schema/species.schema.json`](repo:schema/species.schema.json) | 旅行者能看到的物种，挂在某个分类单元下 |
| `data/regions/` | [`schema/region.schema.json`](repo:schema/region.schema.json) | 目的地或典型场景，及各月可见物种 |
| `data/sources/` | [`schema/source.schema.json`](repo:schema/source.schema.json) | 文献与数据库引用 |

公共定义见 [`schema/common.schema.json`](repo:schema/common.schema.json)。另有 [`schema/trip.schema.json`](repo:schema/trip.schema.json)，是行程工作台的交换格式。

## 分类单元（taxon）

- `parent` 构成一棵**单根树**；根是 `eukaryota`，`parent: null`。
- `rank` 可以是 `clade`（无等级演化支），这是分子系统发育的常态，不必硬凑传统等级。
- `pruned: true` 表示此节点与其子节点之间省略了中间演化支（界面用虚线表示）。
- `phylo.monophyly`：`strong`、`moderate`、`contested`、`paraphyletic`、`unknown`。传统但并系的类群（如“蜥蜴”）应标 `paraphyletic` 并在 `phylo.debate` 解释。
- `phylo.age_mya`：冠群年龄，**必须是区间**：`estimate`、`min`、`max`、`confidence`、`source`，并满足 `min ≤ estimate ≤ max`。
- `phylo.synapomorphies`：帮助识别该类群的共有衍征。

## 物种（species）

- `taxon` 指向所属分类单元（通常是科）；`kingdom` 必须与该单元一致。
- `identification`：辨认要点与易混淆物种。
- `evolution.story` + `evolution.evidence[]`：演化故事与证据列表；每条证据有类型（基因组、分子钟、化石…）和 `source`。
- `travel`：最佳月份、栖息地、国家、注意事项。
- `conservation`：IUCN 等级、截至年份、来源。
- `media[]`：可选；**必须**写明许可证和署名，只放允许再分发的图片。

## 场景（region）

- `kind: destination`（有坐标）或 `scene`（典型场景，如寺庙庭园）。
- `species[]`：每项含 `species`、`months`、`likelihood`（common/regular/uncommon/rare）、可选 `note`。**反向索引由编译器生成**，物种文件里不要重复写它在哪些场景出现。

## 审核状态（review_status）

| 值 | 含义 |
| --- | --- |
| `seed` | 已起草，尚未被独立核对 |
| `reviewed` | 贡献者对照所引文献逐条核对过 |
| `expert-reviewed` | 领域专家确认 |

升级状态必须在 PR 中说明核对了什么。

## 交叉引用规则（`npm run validate` 会检查）

- id 唯一、等于文件名；物种 id 应是学名的小写连字符形式（杂交种 `×` 写作 `x`）。
- `parent`、`taxon`、物种、文献的引用必须存在；单根、无环；物种与分类单元的 `kingdom` 一致。
- 每个物种至少出现在一个场景里（否则给出警告）。

## 审核审计元数据（可选 `review`）

`review_status` 表示当前审核等级；`review` 保存具体审核事件，包括日期、审阅者、方法、核对范围与来源。两者不可互相替代。非 `seed` 记录必须带有审核对象；`expert-reviewed` 还必须由 specialist 以 `expert-assessment` 方法完成。审核记录不代表系统自动验证科学结论。
