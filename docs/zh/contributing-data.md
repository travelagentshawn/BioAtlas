# 贡献数据与科学规范

欢迎人和 AI 一起补充数据。请先通读[数据模型](data-model.md)。

## 工作流

1. 新建分支，修改或新增 `data/` 下的 JSON 文件。
2. `npm run validate`（必须通过）。
3. `npm run check`（提交前最好跑一遍）。
4. 提交 PR，说明：改了什么、依据哪些文献、审核状态是否变化。

网页上的每个物种、分类单元、场景页都有“在 GitHub 上修订这条记录”的链接，直接指向对应文件。

## 科学规则（评审会按此检查）

1. **每个非平凡的科学断言都要有来源。** 来源必须是 `data/sources/` 中的记录。
2. **不得编造引用。** DOI、作者、年份、卷页必须来自你实际核对过的文献。不确定就**不要写 `doi`**，并保持 `seed`。
3. **分歧年代永远是区间**，写明 `confidence`（`high` / `moderate` / `approximate`）与来源。不同研究的估计不一致时，取能涵盖主要估计的区间，并在 `phylo.debate` 说明。
4. **并系类群必须标注。** 传统类群与分子证据冲突时，标 `monophyly: "paraphyletic"` 或 `"contested"` 并解释，而不是悄悄沿用旧说法。
5. **区分“证据”与“推测”。** `evolution.story` 只写文献支持的内容；证据类型要如实选择（基因组、分子钟、化石、形态、生态、分类学）。
6. **IUCN 等级必须写 `as_of` 年份。** 它会变化；写不出确切年份就不要写。
7. **图片只放有明确许可的。** `media` 的 `license`、`attribution`、`source_url` 都是必填；不确定就不放。
8. **旅行信息要具体且负责任。** 最佳月份与场景应来自可靠来源或你的实地经验；涉及野生动物的行为提示（投喂、距离）写在 `travel.etiquette`。
9. **中英文都要写。** `zh` 与 `en` 缺一不可；其他语言可选。

## 提升审核状态

- `seed → reviewed`：对照每条引用逐项核对（引用真实存在、断言与原文一致、年代区间合理），并在 PR 中列出核对清单。
- `reviewed → expert-reviewed`：由该类群的领域专家确认，PR 中注明审阅人与日期。

## 数据质量小贴士

- 分类单元的 `sources` 至少一条，否则 `validate` 会警告。
- 想补充没有对应分类单元的物种：先建科（必要时建演化支），再建物种。
- 外部标识（`external_ids`：GBIF、NCBI、Wikidata…）只写你**验证过**的值。


## 可追溯审核记录（新增字段 `review`）

当记录从 `seed` 提升为 `reviewed` 或 `expert-reviewed` 时，必须在同一条记录中填写 `review`，而不只是在 PR 描述中写一句“已核对”。

```json
{
  "review": {
    "reviewed_at": "YYYY-MM-DD",
    "reviewed_by": "GitHub 用户名或可核验的审阅者标识",
    "reviewer_role": "contributor",
    "method": "literature-check",
    "sources": ["对应的-source-id"],
    "scope": ["taxonomy", "identification", "distribution", "phenology"],
    "notes": { "zh": "核对范围与仍存疑点", "en": "What was checked and what remains uncertain" }
  }
}
```

- `reviewed_at` 使用实际审阅日期，不得回填或猜测。
- `reviewed_by` 应能在贡献记录中对应到真实审阅者；不要写 AI 模型名冒充人类审阅者。
- `reviewer_role: specialist` 且 `method: expert-assessment` 才能支持 `expert-reviewed`。
- `sources` 必须至少包含一个仓库中已存在的来源 ID。现场观察也应建立可追溯的观察记录来源，不能伪装成已发表文献。
- `review` 是审核过程记录，不是自动认证；有审核元数据不等于结论必然正确。
- 旧记录保持原样；本次不会批量把任何 `seed` 改成已审核。


## 地区出现记录的证据要求

新增或修订 `data/regions/*.json` 中的物种月份关联时，优先为每条关联填写 `evidence`。例如：

```json
{
  "species": "acer-palmatum",
  "months": [10, 11],
  "likelihood": "common",
  "evidence": [
    { "type": "regional-checklist", "source": "existing-regional-flora-source" }
  ]
}
```

来源必须确实支持该地区的出现记录及相应月份。若来源只支持“分布于该国家”，不能据此推导某个景区或某个月份。暂时找不到来源时，保留原始关联并让界面显示“月份待核实”，不要补造证据。
