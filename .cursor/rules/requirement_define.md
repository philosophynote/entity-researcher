# 要件定義書

## 1. 概要

本システムは、ユーザーが企業名を入力することで、関連する企業情報や最新のニュース、口コミ、プレスリリースなど多角的な情報を自動収集・表示するWebアプリケーションです。生成AIやWeb検索、ブラウザ自動操作を活用し、信頼性の高い情報を効率的に提供します。

---

## 2. 機能要件

### 2.1 フロントエンド

- ユーザーは自由入力形式で企業名を入力できる
- 入力内容は送信ボタンでバックエンドに送信される
- 企業候補（法人番号・企業名・所在地）から調べたい企業を選択できる
- 選択した企業の情報をテーブル形式（|タイトル|情報源URL|リスクレベル|）で表示する

### 2.2 バックエンド

- Next.js API Routeでフロントエンドからの入力を受け取る
- MastraのAIエージェントを利用し、Web検索・情報収集を行う
- 型定義とZodによるバリデーションを実施し、取得データの正確性を担保する

#### 2.2.1 企業特定

- 入力情報から検索クエリを生成
- PerplexityのMCPサーバー（perplexity_ask）を利用し、企業候補（法人番号・企業名・所在地）を返却

#### 2.2.2 企業情報収集

- PerplexityのMCPサーバーを利用し、以下の情報を取得
  - **企業基本情報の出力型（TypeScript定義）**
    - コーポレートURL
    - 商品/サービスのLP（Landing Page）URL
    - 業種（`src/mastra/jis_industry_classification.yaml`の`subcategories`から選択）
    - 電話番号
    - 従業員数
    - 設立年月日
    - 企業概要（100文字程度）

- PlaywrightのMCPサーバーでブラウザ操作し、以下を取得
  - 社会保険加入状況および被保険者人数（[参照HP](https://www2.nenkin.go.jp/do/search_section/)）

- ネットで取得
  - プレスリリース情報
    - [PR TIMES](https://prtimes.jp/)から半年間のプレスリリース情報を取得
  - NEWS APIを利用して該当企業のニュースを取得
  - 上記で取得した情報のリスクレベルを判定

---

## 3. 非機能要件

- TypeScriptによる型安全な実装
- Zodによる入力・出力のバリデーション
- UIはTailwind CSSおよびshadcn/uiを利用し、ユーザビリティを重視
- 主要な処理・関数にはJSDocコメントを付与
- コードはリーダブルコードの原則に従い、可読性・保守性を重視

---

## 4. ディレクトリ構成

- `src/app/**`：App Router配下に`layout.tsx`、`page.tsx`を配置
- `src/components/**`：共通UIコンポーネント
- `src/components/ui`：shadcn/uiコンポーネント
- `src/lib/**`：ユーティリティ
- `src/app/api/**`：APIルート
- `src/mastra/**`：Mastra関連コード

---

## 5. 使用技術

- TypeScript
- React v19
- Next.js v15（App Router）
- Mastra
- AI SDK
- Tailwind CSS
- shadcn/ui
- Node.js v22
- npm v10.9.0

---

