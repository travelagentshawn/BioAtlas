# クイックスタート

## 必要環境

- Node.js 20 以上
- npm
- Git

外部ランタイム依存やビルド用ライブラリはありません。

## ローカル起動

```bash
npm run dev
```

検証、API と UI のビルドを行い、ローカルサーバーを起動します。

## 主なコマンド

| コマンド | 用途 |
| --- | --- |
| `npm run validate` | データを JSON Schema と相互参照で検証 |
| `npm run build:api` | 構造化データから API v1 を生成 |
| `npm run build:ui` | UI をビルド |
| `npm run check` | CI と同じ検証・ビルド・テスト |

## データの追加

`data/species/`、`data/taxa/`、`data/regions/`、`data/sources/` に JSON ファイルを追加し、必ず `npm run check` を実行してください。科学的な出典とレビュー要件は「データ提供と科学的ルール」を参照してください。
