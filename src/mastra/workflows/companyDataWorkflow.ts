import { z } from 'zod';
import { createWorkflow, createStep } from '@mastra/core/workflows/vNext';
import { companyDataAgent, CompanyData, fetchCompanyData, parseCompanyData } from '../agents/companyDataAgent';
import { classifyIndustryAgent } from '../agents/classifyIndustryAgent';

// 共通スキーマ
const fieldWithSourceString = z.object({
  value: z.string(),
  source: z.array(z.string())
});
const fieldWithSourceStringArray = z.object({
  value: z.array(z.string()),
  source: z.array(z.string())
});
const fieldWithSourceNumber = z.object({
  value: z.number(),
  source: z.array(z.string())
});

// 企業基本情報取得ステップ
const collectCompanyDataStep = createStep({
  id: 'collectCompanyData',
  description: '企業名と法人番号を入力として企業基本情報を取得する',
  inputSchema: z.object({
    companyName: z.string().describe('企業名'),
    corporateNumber: z.string().regex(/^\d{13}$/, '法人番号は13桁の数字で入力してください').describe('法人番号'),
    address: z.string().describe('企業所在地'),
  }),
  outputSchema: z.object({
    representative: fieldWithSourceString,
    corporateUrl: fieldWithSourceString,
    landingPages: fieldWithSourceStringArray,
    phone: fieldWithSourceString,
    employees: fieldWithSourceNumber,
    founded: fieldWithSourceString, 
    overview: fieldWithSourceString,
  }),
  execute: async ({ inputData }) => {
    // 企業データ取得関数を呼び出し
    const { companyName, address } = inputData;
    const result = await fetchCompanyData(companyName, address);
    
    if (!result) {
      throw new Error('企業データの取得に失敗しました');
    }
    return result;
  },
});

/**
 * 企業概要から業種分類ステップ
 */
const classifyIndustryStep = createStep({
  id: 'classifyIndustry',
  description: '企業概要から日本標準産業分類を用いて業種を判定する',
  inputSchema: collectCompanyDataStep.outputSchema,
  outputSchema: z.object({ industry: z.string().describe('業種コードと名称') }),
  execute: async ({ inputData }) => {
    const { overview } = inputData;
    // GPTエージェント呼び出しで最適な業種を選択
    const response = await classifyIndustryAgent.generate([{ role: 'user', content: overview.value }]);
    const industry = response.text.trim();
    return { industry };
  },
});

// ワークフロー定義
export const companyDataWorkflow = createWorkflow({
  id: 'company-data-workflow',
  inputSchema: collectCompanyDataStep.inputSchema,
  outputSchema: collectCompanyDataStep.outputSchema.extend({
    industry: z.string().describe('業種コードと名称'),
  }),
})
  .then(collectCompanyDataStep)
  .map({
    representative: { step: collectCompanyDataStep, path: 'representative' },
    corporateUrl:    { step: collectCompanyDataStep, path: 'corporateUrl' },
    landingPages:    { step: collectCompanyDataStep, path: 'landingPages' },
    phone:           { step: collectCompanyDataStep, path: 'phone' },
    employees:       { step: collectCompanyDataStep, path: 'employees' },
    founded:         { step: collectCompanyDataStep, path: 'founded' },
    overview:        { step: collectCompanyDataStep, path: 'overview' },
  })
  .then(classifyIndustryStep)
  .map({
    representative: { step: collectCompanyDataStep, path: 'representative' },
    corporateUrl:    { step: collectCompanyDataStep, path: 'corporateUrl' },
    landingPages:    { step: collectCompanyDataStep, path: 'landingPages' },
    phone:           { step: collectCompanyDataStep, path: 'phone' },
    employees:       { step: collectCompanyDataStep, path: 'employees' },
    founded:         { step: collectCompanyDataStep, path: 'founded' },
    overview:        { step: collectCompanyDataStep, path: 'overview' },
    industry:        { step: classifyIndustryStep, path: 'industry' },
  })
  .commit(); 