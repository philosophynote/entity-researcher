import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { searchSocialInsurance } from '../tools/socialInsuranceTool';

type insuredStatus = "加入中"|"未加入";

/**
 * 社会保険加入状況および被保険者人数の出力型
 */
export type SocialInsurance = {
  insuredStatus: insuredStatus;
  insuredCount: number;
};

/**
 * HTTP リクエストベースで社会保険加入状況を取得するエージェント
 */
export const socialInsuranceAgent = new Agent({
  name: 'socialInsuranceAgent',
  model: openai('gpt-4.1-mini'),
  tools: { searchSocialInsurance },
  instructions: `
法人番号を受け取ったら searchSocialInsurance ツールを呼び出し、
社会保険加入状況と被保険者数を取得してください。
ユーザーへの最終出力は TypeScript 型 SocialInsurance の JSON のみとします。
  `,
});
