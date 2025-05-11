import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCompanyCandidates } from '@/mastra/tools/getCompanyCandidates';
import { RuntimeContext } from '@mastra/core/runtime-context';

// 入力バリデーション用スキーマ
const CompanySearchSchema = z.object({
  query: z.string().min(1, '企業名またはキーワードを入力してください'),
});

export type CompanySearchInput = z.infer<typeof CompanySearchSchema>;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CompanySearchSchema.parse(body);
    // Agentに処理を委譲
    const candidates = await getCompanyCandidates.execute({ context: { query: parsed.query }, runtimeContext: new RuntimeContext() });
    return NextResponse.json(candidates);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
} 