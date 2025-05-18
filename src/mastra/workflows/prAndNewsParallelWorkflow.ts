import { createWorkflow, createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import { makeNamePrompt, classifyRiskStep, classifyNewsRiskStep } from './companyInfoWorkflow';
import { prtimesKeywordSearch } from '../tools/prTimesKeywordSearch';
import { fetchNewsByCompany } from '../tools/fetchNewsTool';

// PR TIMESツールをステップ化
const prtimesToolStep = createStep(prtimesKeywordSearch);
// NEWS APIツールをステップ化
const fetchNewsToolStep = createStep(fetchNewsByCompany);
<<<<<<< Updated upstream
=======

// --- 初期入力受け渡し＆ログ出力ステップ ---
const initialStep = createStep({
  id: 'initial',
  description: 'ワークフロー初期入力をラップして返す',
  inputSchema: z.object({ companyName: z.string().describe('企業名') }),
  outputSchema: z.object({ companyName: z.string().describe('企業名') }),
  async execute({ inputData }) {
    console.log('[prAndNews] initial input:', inputData);
    return { companyName: inputData.companyName };
  },
});

// --- ログ出力用ステップ (prFlow) ---
const logPrInputStep = createStep({
  id: 'logPrInput',
  inputSchema: prtimesToolStep.inputSchema,
  outputSchema: prtimesToolStep.inputSchema,
  async execute({ inputData }) {
    console.log('[prFlow] prtimesKeywordSearch input:', inputData);
    return inputData;
  },
});
const logPrOutputStep = createStep({
  id: 'logPrOutput',
  inputSchema: classifyRiskStep.outputSchema,
  outputSchema: classifyRiskStep.outputSchema,
  async execute({ inputData }) {
    console.log('[prFlow] classifyRiskStep output:', inputData);
    return inputData;
  },
});

// --- ログ出力用ステップ (newsFlow) ---
const logNewsInputStep = createStep({
  id: 'logNewsInput',
  inputSchema: fetchNewsToolStep.inputSchema,
  outputSchema: fetchNewsToolStep.inputSchema,
  async execute({ inputData }) {
    console.log('[newsFlow] fetchNewsByCompany input:', inputData);
    return inputData;
  },
});
const logNewsOutputStep = createStep({
  id: 'logNewsOutput',
  inputSchema: classifyNewsRiskStep.outputSchema,
  outputSchema: classifyNewsRiskStep.outputSchema,
  async execute({ inputData }) {
    console.log('[newsFlow] classifyNewsRiskStep output:', inputData);
    return inputData;
  },
});
>>>>>>> Stashed changes

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
  .then(logPrInputStep)
  .then(prtimesToolStep)
  .map({ pressReleases: { step: prtimesToolStep, path: '.' } })
  .then(classifyRiskStep)
  .then(logPrOutputStep)
  .commit();

// NEWS API 取得→分類サブワークフロー
export const newsFlow = createWorkflow({
  id: 'news-flow',
  inputSchema: fetchNewsToolStep.inputSchema,
  outputSchema: classifyNewsRiskStep.outputSchema,
})
  .then(logNewsInputStep)
  .then(fetchNewsToolStep)
  .map({ news: { step: fetchNewsToolStep, path: '.' } })
  .then(classifyNewsRiskStep)
<<<<<<< Updated upstream
=======
  .then(logNewsOutputStep)
>>>>>>> Stashed changes
  .commit();

// メイン・ワークフロー
export const prAndNewsParallelWorkflow = createWorkflow({
  id: 'pr-and-news-parallel-workflow',
<<<<<<< Updated upstream
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
=======
  inputSchema: z.object({ companyName: z.string().describe('企業名') }),
  outputSchema: z.object({
    prRisks: z.array(riskSchema).describe('プレスリリースリスク'),
    newsRisks: z.array(riskSchema).describe('ニュースリスク'),
  }),
})
  .then(initialStep)
  .map({
    // initialStep の出力を利用して各フローに必要な入力をマッピング
    keyword:    { step: initialStep, path: 'companyName', schema: z.string().describe('検索キーワード') },
    companyName:{ step: initialStep, path: 'companyName', schema: z.string().describe('企業名') },
  })
  .parallel([
    prFlow,
    newsFlow,
  ])
  .map({
    prRisks:  { step: prFlow,  path: '.' },
    newsRisks:{ step: newsFlow, path: '.' },
>>>>>>> Stashed changes
  })
  .commit(); 