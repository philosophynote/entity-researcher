import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { mcp } from '../mcp';

type insuredStatus = "加入中"|"未加入";

/**
 * 社会保険加入状況および被保険者人数の出力型
 */
export type SocialInsurance = {
  insuredStatus: insuredStatus;
  insuredCount: number;
};

/**
 * Playwright MCP ツールとカスタムツールを組み合わせたブラウザ自動操作エージェント
 */
export const socialInsuranceAgent = new Agent({
  name: 'socialInsuranceAgent',
  model: openai('gpt-4.1-mini'),
  tools: await mcp.getTools(),
  instructions:  
  `あなたには法人番号が与えられるので、以下の手順で社会保険加入状況および被保険者人数を取得してください:\n
  1. https://www2.nenkin.go.jp/do/search_section/にアクセス\n
  2. 検索条件を法人番号検索に設定\n
  3. 検索フォームに法人番号を入力して検索\n
  4. 検索結果がない場合は加入状況は未加入\n
  5. 検索結果がある場合は加入状況は加入中とと見做して、被保険者数を取得\n
  6. 検索結果をTypeScript型 SocialInsurance のJSON配列として返す`,
}); 