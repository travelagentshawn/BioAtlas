# 分类权威与名称治理规则

BioAtlas 采用**分层、按类群选择权威来源**的模式。任何单一数据库都不能自动成为所有生物、所有分类问题的最终裁判。

## 不同角色不可混用

| 角色 | 可以支持的内容 | 不能单独决定的内容 |
| --- | --- | --- |
| 全球综合骨架 | 广泛名称检索、标识符交叉映射、统一入口 | 所有谱系的最终专业分类 |
| 命名索引 | 名称发表与命名学记录 | 普遍适用的系统发育分类或保护等级 |
| 专业类群名录 | 特定类群内的接受名与分类 | 其专业范围以外的分类 |
| 分类框架 | 指定类群和版本的高阶关系 | 范围以外的物种命名有效性 |
| 保护评估 | 有日期的灭绝风险评估 | 分类接受状态或永久不变的保护等级 |

## 权威来源登记表

结构化登记表发布于 `/api/v1/taxonomic-authorities.json`，对应来源记录位于 `data/sources/authority-*.json`。

| 类群 / 用途 | 优先来源 | 治理说明 |
| --- | --- | --- |
| 全球名称发现与交叉映射 | Catalogue of Life eXtended Release（COL XR） | GBIF 当前主要分类骨架已转向 COL XR；每次导入必须固定版本。 |
| 植物名称发表记录 | International Plant Names Index（IPNI） | 命名索引，不等同于接受物种名录。 |
| 植物接受名与分布 | Plants of the World Online（POWO） | 记录访问日期和具体条目；有争议时回到专业文献。 |
| 被子植物高阶分类 | APG IV（及后续正式发表的 APG 更新） | 仅用于被子植物目、科层级，必须注明版本。 |
| 真菌名称 | Index Fungorum / Species Fungorum、MycoBank | 两者标识符与分歧都应保留；争议需结合最新文献和命名法规。 |
| 鸟类 | IOC World Bird List | 保存准确版本；不同鸟类名录的分类概念可能不同，不得静默合并。 |
| 爬行动物 | The Reptile Database | 专业爬行动物名录，记录访问日期。 |
| 两栖动物 | Amphibian Species of the World | 专业两栖动物名录，记录访问日期。 |
| 哺乳动物 | Mammal Diversity Database | 保存准确版本。 |
| 鱼类 | Catalog of Fishes | 专业鱼类命名与分类目录。 |
| 海洋生物 | World Register of Marine Species（WoRMS） | 保留 AphiaID 和访问日期。 |
| 辅助交叉映射 | ITIS、NCBI Taxonomy | 可用于标识符和分类参考，不是所有类群的唯一裁判。 |
| 保护等级 | IUCN Red List | 独立的、有日期的保护评估，不能作为分类权威。 |

GBIF Backbone Taxonomy 仅保留用于历史标识符映射和兼容。GBIF 官方文档说明其已停止更新，并由 COL XR 取代为主要分类骨架；原有标识符仍保持兼容。因此不得将旧 Backbone 作为新接受名判断的默认依据。

## 记录级分类断言

分类单元和物种可使用 `taxonomic_assertions[]`，每条记录：

- `authority`：`data/sources/` 中的权威来源 ID
- `record_id`：该来源中的准确记录标识符
- `scientific_name`：来源返回的名称字符串
- `name_status`：`accepted`、`synonym`、`unresolved` 或 `unassessed`
- `classification_system`、`version`：可选的分类体系与版本
- `accessed_at`：实际核对日期
- `source`：支持该断言的具体来源记录

如果标识符只是从仓库已有引用中迁移而来，尚未重新打开权威记录核对，应标记为 `unassessed`。标识符不等于接受名证明。不同来源的断言并存，不互相覆盖。

## 选择与冲突处理

1. 按类群范围和断言类型选择来源，而不是按数据库知名度选择。
2. 区分名称命名学有效性、接受名状态、分类概念和系统发育分类。
3. 分类概念有争议时，优先采用适用范围内最新的专业处理和原始分类学文献。
4. 保留来源、准确记录 ID、版本和访问日期；不得静默重写或删除旧断言。
5. 来源间发生冲突时，保留双方记录并解释差异；经核对前 BioAtlas 状态保持未决。
6. 不得通过名称字符串猜测权威记录 ID，必须查询并核实。
7. 来源更新不意味着 BioAtlas 记录可以自动从 `seed` 晋升为 `reviewed`。

## 更新与迁移政策

权威数据只能以明确、可审查的批次导入。每批需记录来源版本或访问日期、快照、匹配方法、标识符变更、接受名变化、异名变化及未决冲突。不得在未经审查的情况下批量替换现有 BioAtlas 名称或父级分类关系；正式大规模替换前必须提供差异清单并获得明确批准。

## 参考资料

- [GBIF 分类解释文档](https://techdocs.gbif.org/en/data-processing/taxonomy-interpretation)
- [GBIF 分类标识符处理](https://techdocs.gbif.org/en/data-publishing/LSID-lookup)
- [NCBI 分类资源目录](https://ncbi.nlm.nih.gov/datasets/docs/v2/data-processing/taxonomy-processing/taxonomy-resources/)
- [ITIS](https://www.itis.gov/)
