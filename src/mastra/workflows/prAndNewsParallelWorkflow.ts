import { createWorkflow } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import { makeNamePrompt, prtimesApiStep, parsePressReleasesStep, classifyRiskStep, fetchNewsStep, parseNewsStep, classifyNewsRiskStep } from './companyInfoWorkflow';

// リスク判定結果の共通スキーマ
const riskSchema = z.object({
  url: z.string(),
  label: z.string(),
  reason: z.string(),
});

// PR TIMES 用サブワークフロー
const prFlow = createWorkflow({
  id: 'pr-flow',
  inputSchema: prtimesApiStep.inputSchema,
  outputSchema: classifyRiskStep.outputSchema,
})
  .then(prtimesApiStep)
  .map({ text: { step: prtimesApiStep, path: 'text' } })
  .then(parsePressReleasesStep)
  .map({ pressReleases: { step: parsePressReleasesStep, path: 'pressReleases' } })
  .then(classifyRiskStep)
  .commit();

// NEWS API 用サブワークフロー
const newsFlow = createWorkflow({
  id: 'news-flow',
  inputSchema: fetchNewsStep.inputSchema,
  outputSchema: classifyNewsRiskStep.outputSchema,
})
  .then(fetchNewsStep)
  .map({ text: { step: fetchNewsStep, path: 'text' } })
  .then(parseNewsStep)
  .map({ news: { step: parseNewsStep, path: 'news' } })
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
  steps: [makeNamePrompt, prFlow, newsFlow],
})
  .then(makeNamePrompt)
  .map({ prompt: { step: makeNamePrompt, path: 'prompt' } })
  // PR TIMES と NEWS API を並行取得→パース→リスク判定
  .parallel([prFlow, newsFlow])
  .map({
    prRisks: { step: prFlow, path: 'output' },
    newsRisks: { step: newsFlow, path: 'output' },
  })
  .commit(); 