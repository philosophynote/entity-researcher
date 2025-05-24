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

// --- 初期入力受け渡し＆ログ出力ステップ ---
const initialStep = createStep({
  id: 'initial',
  description: 'ワークフロー初期入力をラップして返す',
  inputSchema: z.object({ companyName: z.string().describe('企業名'), corporateNumber: z.string().length(13).describe('法人番号'), address: z.string().describe('住所') }),
  outputSchema: z.object({ companyName: z.string().describe('企業名'), corporateNumber: z.string().length(13).describe('法人番号'), address: z.string().describe('住所') }),
  async execute({ inputData }) {
    return { companyName: inputData.companyName, corporateNumber: inputData.corporateNumber, address: inputData.address };
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
  .then(logNewsOutputStep)
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
  id: 'pr-and-news-parallel-workflow',
  inputSchema: z.object({ companyName: z.string().describe('企業名'), corporateNumber: z.string().length(13).describe('法人番号'), address: z.string().describe('住所') }),
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
    corporateNumber: { step: initialStep, path: 'corporateNumber', schema: z.string().length(13).describe('法人番号') },
    address: { step: initialStep, path: 'address', schema: z.string().describe('住所') },
  })
  .parallel([
    prFlow,
    newsFlow,
  ])
  .map({
    prRisks:  { step: prFlow,  path: '.' },
    newsRisks:{ step: newsFlow, path: '.' },
  })
  .commit(); 