import { z } from 'zod';
import { createWorkflow } from '@mastra/core/workflows/vNext';
import { companyDataWorkflow } from './companyDataWorkflow';
import { nenkinCorporateSearch } from './nenkinCorporateSearch';
import { prAndNewsParallelWorkflow } from './prAndNewsParallelWorkflow';

/**
 * 企業情報取得・リスク分析・社会保険情報検索を統合したワークフロー
 */
export const fullCompanyWorkflow = createWorkflow({
  id: 'full-company-workflow',
  inputSchema: z.object({
    companyName: z.string().describe('企業名'),
    corporateNumber: z.string().length(13).describe('法人番号'),
  }),
  outputSchema: z.object({
    // 企業基本情報
    representative: z.string().describe('代表者'),
    corporateUrl: z.string().describe('企業URL'),
    landingPages: z.array(z.string()).describe('LP一覧'),
    phone: z.string().describe('電話番号'),
    employees: z.number().describe('従業員数'),
    founded: z.string().describe('設立日'),
    overview: z.string().describe('企業概要'),
    industry: z.string().describe('業種'),
    // 社会保険情報
    insuredStatus: z.union([z.literal('加入中'), z.literal('未加入')]).describe('社会保険加入状況'),
    insuredCount: z.number().describe('被保険者数'),
    // プレスリリース・ニュースリスク
    prRisks: z.array(z.object({ url: z.string(), label: z.string(), reason: z.string() })).describe('プレスリリースのリスク'),
    newsRisks: z.array(z.object({ url: z.string(), label: z.string(), reason: z.string() })).describe('ニュースのリスク'),
  }),
})
  .parallel([companyDataWorkflow, nenkinCorporateSearch, prAndNewsParallelWorkflow])
  .map({
    representative: { step: companyDataWorkflow, path: 'representative' },
    corporateUrl: { step: companyDataWorkflow, path: 'corporateUrl' },
    landingPages: { step: companyDataWorkflow, path: 'landingPages' },
    phone: { step: companyDataWorkflow, path: 'phone' },
    employees: { step: companyDataWorkflow, path: 'employees' },
    founded: { step: companyDataWorkflow, path: 'founded' },
    overview: { step: companyDataWorkflow, path: 'overview' },
    industry: { step: companyDataWorkflow, path: 'industry' },
    insuredStatus: { step: nenkinCorporateSearch, path: 'insuredStatus' },
    insuredCount: { step: nenkinCorporateSearch, path: 'insuredCount' },
    prRisks: { step: prAndNewsParallelWorkflow, path: 'prRisks' },
    newsRisks: { step: prAndNewsParallelWorkflow, path: 'newsRisks' },
  })
  .commit(); 