import { createWorkflow, createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import { prtimesKeywordSearch } from '../tools/prTimesKeywordSearch';
import { fetchNewsByCompany } from '../tools/fetchNewsTool';
import { searchSocialInsurance } from '../tools/socialInsuranceTool';
import { classifyRiskAgent } from '../agents/classifyRiskAgent';

/* --- I/O スキーマ -------------------------------------------------- */
const workflowInputSchema = z.object({
  corporateNumber: z.string(),
  name: z.string(),
  address: z.string(),
});

export const classifyRiskStep = createStep({
  id: "classifyRiskStep",
  description: "プレスリリースURLごとにリスク判定を実施",
  inputSchema: z.object({
    pressReleases: z.array(
      z.object({
        title: z.string(),
        date: z.string(),
        url: z.string(),
      })
    ),
  }),
  outputSchema: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      label: z.string(),
      reason: z.string(),
    })
  ),
  execute: async ({ inputData }) => {
    const results: { title: string; url: string; label: string; reason: string; }[] | PromiseLike<{ title: string; url: string; label: string; reason: string; }[]> = [];
    for (const pr of inputData.pressReleases) {
      // URLをそのままuserメッセージとして渡す
      const res = await classifyRiskAgent.generate([`URL: ${pr.url}`]);
      // 返却値のtextからラベルと理由を抽出
      const text = res.text || "";
      const labelMatch = text.match(/ラベル[:：]\s*(\S+)/);
      const reasonMatch = text.match(/理由[:：]\s*([^\n]+)/);
      results.push({
        title: pr.title,
        url: pr.url,
        label: labelMatch ? labelMatch[1] : "",
        reason: reasonMatch ? reasonMatch[1] : text,
      });
    }
    return results;
  },
});

export const makeCorporateNumberPrompt = createStep({
  id: "makeCorporateNumberPrompt",
  description:
    "法人番号を企業情報収集エージェント向けに渡す",
  inputSchema: workflowInputSchema,
  outputSchema: z.object({ prompt: z.string() }),
  execute: async ({ inputData }) => {
    return {
      prompt: `${inputData.corporateNumber}`,
    };
  },
});

export const classifyNewsRiskStep = createStep({
  id: "classifyNewsRiskStep",
  description: "ニュースURLごとにリスク判定を実施",
  inputSchema: z.object({
    news: z.array(
      z.object({
        title: z.string(),
        date: z.string(),
        url: z.string(),
      })
    ),
  }),
  outputSchema: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      label: z.string(),
      reason: z.string(),
    })
  ),
  execute: async ({ inputData }) => {
    const results: { title: string; url: string; label: string; reason: string; }[] | PromiseLike<{ title: string; url: string; label: string; reason: string; }[]> = [];
    for (const n of inputData.news) {
      const res = await classifyRiskAgent.generate([`URL: ${n.url}`]);
      const text = res.text || "";
      const labelMatch = text.match(/ラベル[:：]\s*(\S+)/);
      const reasonMatch = text.match(/理由[:：]\s*([^\n]+)/);
      results.push({
        title: n.title,
        url: n.url,
        label: labelMatch ? labelMatch[1] : "",
        reason: reasonMatch ? reasonMatch[1] : text,
      });
    }
    return results;
  },
});

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

// リスク判定結果の共通スキーマ
const riskSchema = z.object({
  title: z.string(),
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