---
description: |
  CodeX agent guidelines for the Entity Researcher repository.
  Based on README and the rules in `.cursor/rules`.
globs:
  - "**/*"
alwaysApply: true
---
# 目的

このリポジトリは Next.js と Mastra を組み合わせ、LLM を活用して企業情報を収集・整理する Web アプリケーションです。主な機能やディレクトリ構成、開発時のルールは README.md と `.cursor/rules/basic.mdc`、`.cursor/rules/requirement_define.md` に記載されています。

# 機能概要（README より）
- 企業名から候補を検索し、法人番号・所在地などを取得
- 選択した企業の基本情報、プレスリリース、ニュース、口コミ等を取得
- Mastra のエージェント・ツールを用いたワークフローを実装

# 技術スタック（requirements/basic より）
- TypeScript / React v19 / Next.js v15 (App Router)
- Mastra と AI SDK
- Tailwind CSS + shadcn/ui
- Node.js v22、npm 10.9.0

# ディレクトリ構成
- `src/app/**` : ページ・API ルート (`layout.tsx`, `page.tsx` など)
- `src/components/**` : 共通 UI コンポーネント
- `src/components/ui` : shadcn/ui 由来のコンポーネント
- `src/lib/**` : ユーティリティ
- `src/mastra/**` : Mastra のエージェントやワークフロー

# 実装方針
- 既存コードを参考にし、`any` 型は避ける
- 関数が長い場合は適切に分割し、JSDoc を付与
- API Route/Action では Zod で入力を検証し、推論型をそのまま返却
- コメントを積極的に追加し、リーダブルコードを意識
- Mastra を使う場合は MCP サーバー経由でドキュメントを参照

# 非機能要件
- TypeScript による型安全
- Zod によるバリデーション
- Tailwind CSS を用いた UI
- 主要な処理には JSDoc コメントを付ける

# 使用ツール
- Perplexity MCP サーバー
- Playwright MCP サーバー

# コミット
- 変更点を端的にまとめた日本語のコミットメッセージとする
