import { createWorkflow, createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import { makeNamePrompt, classifyRiskStep, classifyNewsRiskStep } from './companyInfoWorkflow';
import { prtimesKeywordSearch } from '../tools/prTimesKeywordSearch';
import { fetchNewsByCompany } from '../tools/fetchNewsTool';

// PR TIMESツールをステップ化
const prtimesToolStep = createStep(prtimesKeywordSearch);
// NEWS APIツールをステップ化
const fetchNewsToolStep = createStep(fetchNewsByCompany);

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

// メイン・ワークフロー
export const prAndNewsParallelWorkflow = createWorkflow({
  id: 'pr-and-news-parallel-workflow',
  inputSchema: z.object({ name: z.string() }),
  outputSchema: z.object({
    prRisks: z.array(riskSchema),
    newsRisks: z.array(riskSchema),
  }),
})
  .then(makeNamePrompt)
  .map({
    keyword: { step: makeNamePrompt, path: 'prompt' },
    companyName: { step: makeNamePrompt, path: 'prompt' },
  })
  // PR TIMES と NEWS API を同時に実行
  .parallel([prFlow, newsFlow])
  .map({
    prRisks: { step: prFlow, path: '.' },
    newsRisks: { step: newsFlow, path: '.' },
  })
  .commit(); 