import { createWorkflow, createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import { socialInsuranceAgent } from '../agents/socialInsuranceAgent';

/**
 * 社会保険加入状況を取得するワークフロー
 */
const searchStep = createStep({
  id: 'search',
  inputSchema: z.object({ companyName: z.string(), corporateNumber: z.string().length(13) }),
  outputSchema: z.object({
    insuredStatus: z.union([z.literal('加入中'), z.literal('未加入')]),
    insuredCount: z.number(),
  }),
  async execute({ inputData }) {
    // socialInsuranceAgentで直接取得
    const res = await socialInsuranceAgent.generate([
      { role: 'user', content: inputData.corporateNumber }
    ]);
    // 返却値はJSON配列なのでパース
    let arr: { insuredStatus: '加入中'|'未加入', insuredCount: number }[] = [];
    try {
      arr = JSON.parse(res.text ?? '[]');
    } catch {
      // パース失敗時は未加入0人
      arr = [];
    }
    // 1件目を返す（なければ未加入0人）
    return arr[0] ?? { insuredStatus: '未加入', insuredCount: 0 };
  },
});

export const nenkinCorporateSearch = createWorkflow({
  id: 'nenkin-corporate-search',
  inputSchema: z.object({ companyName: z.string(), corporateNumber: z.string().length(13) }),
  outputSchema: z.object({
    insuredStatus: z.union([z.literal('加入中'), z.literal('未加入')]),
    insuredCount: z.number(),
  }),
})
  .then(searchStep)
  .map({
    insuredStatus: { step: searchStep, path: 'insuredStatus' },
    insuredCount: { step: searchStep, path: 'insuredCount' }
  })
  .commit();
