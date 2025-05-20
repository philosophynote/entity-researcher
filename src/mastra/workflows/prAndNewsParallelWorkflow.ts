import { createWorkflow, createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import { makeNamePrompt, classifyRiskStep, classifyNewsRiskStep, makeCorporateNumberPrompt } from './companyInfoWorkflow';
import { prtimesKeywordSearch } from '../tools/prTimesKeywordSearch';
import { fetchNewsByCompany } from '../tools/fetchNewsTool';
import { searchSocialInsurance } from '../tools/socialInsuranceTool';

// PR TIMESツールをステップ化
const prtimesToolStep = createStep(prtimesKeywordSearch);
// NEWS APIツールをステップ化
const fetchNewsToolStep = createStep(fetchNewsByCompany);
// 社会保険ツールをステップ化
const socialInsuranceToolStep = createStep(searchSocialInsurance);

// リスク判定結果の共通スキーマ
const riskSchema = z.object({
  url: z.string(),
  label: z.string(),
  reason: z.string(),
});

// PR TIMES 取得→分類サブワークフロー（ツール直接呼び出し）
export const prFlow = createWorkflow({
  id: 'pr-flow',
  inputSchema: prtimesToolStep.inputSchema,
  outputSchema: classifyRiskStep.outputSchema,
})
  .then(prtimesToolStep)
  .map({ pressReleases: { step: prtimesToolStep, path: '.' } })
  .then(classifyRiskStep)
  .commit();

// NEWS API 取得→分類サブワークフロー
export const newsFlow = createWorkflow({
  id: 'news-flow',
  inputSchema: fetchNewsToolStep.inputSchema,
  outputSchema: classifyNewsRiskStep.outputSchema,
})
  .then(fetchNewsToolStep)
  .map({ news: { step: fetchNewsToolStep, path: '.' } })
  .then(classifyNewsRiskStep)
  .commit();

// 社会保険取得サブワークフロー
export const socialInsuranceFlow = createWorkflow({
  id: 'social-insurance-flow',
  inputSchema: z.object({ corporateNumber: z.string() }),
  outputSchema: socialInsuranceToolStep.outputSchema,
})
  .then(makeCorporateNumberPrompt)
  .map({ corporateNumber: { step: makeCorporateNumberPrompt, path: 'corporateNumber' } })
  .then(socialInsuranceToolStep)
  .commit();

// メイン・ワークフロー
export const prAndNewsParallelWorkflow = createWorkflow({
  id: 'pr-news-and-social-insurance-parallel-workflow',
  inputSchema: z.object({ companyName: z.string(), corporateNumber: z.string() }),
  outputSchema: z.object({
    prRisks: z.array(riskSchema),
    newsRisks: z.array(riskSchema),
    socialInsurance: socialInsuranceToolStep.outputSchema,
  }),
})
  .map({
    keyword: { value: (ctx) => ctx.companyName, schema: z.string() },
    name: { value: (ctx) => ctx.companyName, schema: z.string() },
    companyName: { value: (ctx) => ctx.companyName, schema: z.string() },
    corporateNumber: { value: (ctx) => ctx.corporateNumber, schema: z.string() },
  })
  .parallel([
    prFlow,
    newsFlow,
    socialInsuranceFlow
  ])
  .map({
    prRisks: { step: prFlow, path: '.' },
    newsRisks: { step: newsFlow, path: '.' },
    socialInsurance: { step: socialInsuranceFlow, path: '.' },
  })
  .commit(); 