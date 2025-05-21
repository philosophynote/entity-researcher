import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MastraClient } from "@mastra/client-js";
const MASTRA_URL = process.env.MASTRA_API_URL ?? "http://localhost:4111";
import { fullCompanyWorkflow } from '@/mastra/workflows/fullCompanyWorkflow';

/**
 * 企業情報取得API 入力スキーマ
 */
const CompanyInfoInputSchema = z.object({
  companyName: z.string().min(1, '企業名は必須です'),
  corporateNumber: z.string().min(1, '法人番号は必須です'),
});

export type CompanyInfoInput = z.infer<typeof CompanyInfoInputSchema>;

/**
 * fullCompanyWorkflowのoutputSchemaに準拠した出力スキーマ
 */
const FullCompanyOutputSchema = z.object({
  representative: z.string(),
  corporateUrl: z.string(),
  landingPages: z.array(z.string()),
  phone: z.string(),
  employees: z.number(),
  founded: z.string(),
  overview: z.string(),
  industry: z.string(),
  insuredStatus: z.union([z.literal('加入中'), z.literal('未加入')]),
  insuredCount: z.number(),
  prRisks: z.array(z.object({ url: z.string(), label: z.string(), reason: z.string() })),
  newsRisks: z.array(z.object({ url: z.string(), label: z.string(), reason: z.string() })),
});

export type FullCompanyOutput = z.infer<typeof FullCompanyOutputSchema>;
const client = new MastraClient({ baseUrl: MASTRA_URL });

/**
 * POST: 企業情報取得
 */
export async function POST(req: NextRequest) {
  try {
    /* 1. 入力バリデーション */
    const input = CompanyInfoInputSchema.parse(await req.json());
    console.log(input);
    /* 2. vNext Workflow を起動 */
    const hoge = await client.getVNextWorkflows();
    console.log(hoge); 
    const fullCompanyWorkflowworkflow = client.getVNextWorkflow('fullCompanyWorkflow');
    const run = fullCompanyWorkflowworkflow.createRun();

    // 完了まで待機する場合は startAsync()
    const payload  = await fullCompanyWorkflowworkflow.startAsync({
      inputData: input,
    });
    console.log("payload");
    console.log(payload);
    /* 3. 出力バリデーション */
    if (payload.status === 'success' && payload.result) {
      const result: FullCompanyOutput = FullCompanyOutputSchema.parse(payload.result);
      /* 4. 正常応答 */
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: 'ワークフロー実行失敗' }, { status: 500 });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      // スキーマ不一致
      return NextResponse.json({ errors: err.errors }, { status: 400 });
    }
    console.error('[company-info API]', err);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}