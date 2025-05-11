# 要件定義書

## 1. 概要

本システムは、ユーザーが企業名を入力することで、関連する企業情報や最新のニュース、口コミ、プレスリリースなど多角的な情報を自動収集・表示するWebアプリケーションです。生成AIやWeb検索、ブラウザ自動操作を活用し、信頼性の高い情報を効率的に提供します。

---

## 2. 機能要件

### 2.1 フロントエンド

- ユーザーは自由入力形式で企業名を入力できる
- 入力内容は送信ボタンでバックエンドに送信される
- 企業候補（法人番号・企業名・所在地）から調べたい企業を選択できる
- 選択した企業の情報をテーブル形式（|項目名|内容|情報源URL|）で表示する

### 2.2 バックエンド

- Next.js API Routeでフロントエンドからの入力を受け取る
- MastraのAIエージェントを利用し、Web検索・情報収集を行う
- 型定義とZodによるバリデーションを実施し、取得データの正確性を担保する

#### 2.2.1 企業特定

- 入力情報から検索クエリを生成
- PerplexityのMCPサーバーを利用し、企業候補（法人番号・企業名・所在地）を返却

#### 2.2.2 企業情報収集

- PerplexityのMCPサーバーを利用し、以下の情報を取得
  - コーポレートURL
  - 商品/サービスのLP（Landing Page）URL
  - 業種（`src/mastra/jis_industry_classification.yaml`の`subcategories`から選択）
  - 電話番号
  - 従業員数
  - 設立年月日
  - 企業概要（100文字程度）

- PlaywrightのMCPサーバーでブラウザ操作し、以下を取得
  - 社会保険加入状況および被保険者人数（[参照HP](https://www2.nenkin.go.jp/do/search_section/)）

- プレスリリース情報
  - PlaywrightのMCPサーバー経由で[PR TIMES](https://prtimes.jp/)から半年間のプレスリリース情報を取得

- 企業関連ニュース
  - PlaywrightのMCPサーバー経由で[日本経済新聞](https://www.nikkei.com/)から該当企業のニュースを取得

- 勤務関連の口コミ
  - PlaywrightのMCPサーバー経由で次のサイトから情報を取得
  - [openwork](https://www.openwork.jp/my_top)
  - [転職会議](https://jobtalk.jp/)
  - [エンゲージ 会社の評判](https://en-hyouban.com/)
  - [キャリコネ](https://careerconnection.jp/)
  - [Yahoo! しごとカタログ](https://jobcatalog.yahoo.co.jp/)

- 匿名掲示板情報
  - PlaywrightのMCPサーバー経由で[5ch](https://itest.5ch.net/)から関連情報を取得

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

# （参考）機能要件詳細

- フロントエンド
 - 自由入力形式で企業名を入力できる
 - 入力後して送信ボタンをクリックするとバックエンドに入力内容が送信される
 - 企業候補から調べたい企業を選択すると企業情報収集を実施する 
 - 企業情報をテーブル形式で表示して下さい
  - テーブル形式では|項目名|内容|情報源URL|で表示して下さい

- バックエンド
 - Next.js API routeで入力情報を受け取り、MastraのAIエージェントを利用してWeb検索・情報収集
 - 型定義を実施して取得データのバリデーションも行います
 - 企業特定の方法
   - フロントエンドで入力された情報から検索クエリを作成する
   - 検索クエリをbrave searchのAPI経由でエンドポイントにアクセスする
   - 企業候補の法人番号と企業名と企業所在地を返却する
 - 企業情報収集
   - Perplexityを利用して次の情報を収集する
    - コーポレートURL
    - 企業が提供する商品/サービスのLP(Landing Page) のURL
    - 業種(`src/mastra/jis_industry_classification.yaml`の`subcategories`から必ず選択して下さい)
    - 電話番号
    - 従業員数
    - 設立年月日
    - 企業概要（100文字程度）
   - Playwright経由でブラウザ操作して次の情報を収集する
    - 社会保険加入状況及び被保険者人数
    - 参照HP→https://www2.nenkin.go.jp/do/search_section/ 
  - プレスリリース情報
    - [PR TIMES](https://prtimes.jp/)から該当企業の半年間のプレスリリース情報を取得
  - 企業に関連するニュース
    - [日本経済新聞](https://www.nikkei.com/)から該当企業のニュースを取得する
  - 勤務関連の口コミを取得する
    - 対象
      - [openwork](https://www.openwork.jp/my_top)
      - [転職会議](https://jobtalk.jp/)
      - [エンゲージ 会社の評判](https://en-hyouban.com/)
      - [キャリコネ](https://careerconnection.jp/)
      - [Yahoo! しごとカタログ](https://jobcatalog.yahoo.co.jp/)
  - 匿名掲示板の情報を取得する
    - 対象
      - [5ch](https://itest.5ch.net/)
