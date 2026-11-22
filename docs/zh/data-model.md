# 数据模型

四类记录，每类一个目录、一个 JSON Schema、**一个文件一条记录**，文件名 = `id` + `.json`。

| 目录 | Schema | 说明 |
| --- | --- | --- |
| `data/taxa/` | [`schema/taxon.schema.json`](repo:schema/taxon.schema.json) | 系统树的节点：演化支、目、科… |
| `data/species/` | [`schema/species.schema.json`](repo:schema/species.schema.json) | 旅行者能看到的物种，挂在某个分类单元下 |
| `data/regions/` | [`schema/region.schema.json`](repo:schema/region.schema.json) | 目的地或典型场景，及各月可见物种 |
| `data/sources/` | [`schema/source.schema.json`](repo:schema/source.schema.json) | 文献与数据库引用 |

公共定义见 [`schema/common.schema.json`](repo:schema/common.schema.json)。另有 [`schema/trip.schema.json`](repo:schema/trip.schema.json)，是行程工作台的交换格式。

## 生物界范围\n\n当前 `kingdom` 支持 `plantae`（植物）、`animalia`（动物）与 `fungi`（真菌）；`root` 仅用于真核生物共同根节点。苔藓归入植物界，不能因为它们是非维管植物而另建一个“界”。\n\n## 分类单元（taxon）

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


## 地区—物种关联证据（可选 `evidence`）

地区记录中的每一条 `species[]` 关联都可以单独附上 `evidence`。证据类型包括实地观察、已发表文献、区域物种名录、数据库记录和专家评估；每条证据必须引用 `data/sources/` 中真实存在的来源 ID。不要把全球分布、栖息地推断或“理论上可能出现”写成实地观察。没有 `evidence` 的关联仍可展示，但界面会标注月份待核实，不能视为已证实的当地物候。

## 分类断言与权威来源登记表

分类单元和物种可以包含 `taxonomic_assertions[]`。每条断言保存权威来源登记 ID、来源中的准确记录 ID、来源返回的学名、名称状态、可选分类体系/版本、访问日期及支持该断言的具体来源记录。若标识符只是迁移而来、尚未重新核验来源记录，应使用 `unassessed`。不同权威可能存在分歧，应并列保留，不得互相覆盖。带有 `authority_role` 元数据的来源记录会生成 `api/v1/taxonomic-authorities.json`。详见[分类权威与名称治理](taxonomy-authorities.md)。
