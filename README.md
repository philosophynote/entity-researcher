# Entity Researcher

**Entity Researcher** は、企業情報を収集・整理する Web アプリケーションです。Next.js と Mastra を組み合わせることで、外部ツールや LLM を利用したリサーチを行います。

## 主な機能

- 企業名から候補を検索し、法人番号・所在地などを取得
- 選択した企業の基本情報やプレスリリース、ニュース、口コミ等を取得
- Mastra の各種エージェント・ツールを利用したワークフロー

## ディレクトリ構成

- `src/app` – Next.js のページと API ルート
- `src/mastra` – エージェント、ツール、ワークフローの実装
- `src/components` – UI コンポーネント
- `src/lib` – 汎用ユーティリティ

## 開発環境のセットアップ

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開くとアプリが表示されます。

### 必要な環境変数

- `MASTRA_API_URL` – Mastra API の URL (デフォルト: `http://localhost:4111`)
- `BRAVE_API_KEY` – Brave Search API キー
- `PERPLEXITY_API_KEY` – Perplexity Sonar API キー
- `NEWS_API_KEY` – News API キー
- `OPENAI_API_KEY` – OpenAI API キー

必要に応じて `.env` などに設定してください。

## ライセンス

本リポジトリは MIT ライセンスです。
