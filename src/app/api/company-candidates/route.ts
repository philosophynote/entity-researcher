import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
const MASTRA_URL = process.env.MASTRA_API_URL ?? "http://localhost:4111";

// 入力バリデーション用スキーマ
const CompanySearchSchema = z.object({
  query: z.string().min(1, '企業名またはキーワードを入力してください'),
});

export type CompanySearchInput = z.infer<typeof CompanySearchSchema>;

export async function POST(req: NextRequest) {
  const dummyData = [
    {
      name: "株式会社アラームボックス",
      corporateNumber: "7011101077374",
      address: "東京都新宿区市谷本村町３番２２号",
    },
    {
      name: "株式会社オルツオルツ",
      corporateNumber: "2010601047082",
      address: "東京都港区六本木7丁目15番78号",
    },
    
  ]
  return NextResponse.json(dummyData);
  // try {
  //   const body = await req.json();
  //   const parsed = CompanySearchSchema.parse(body);
  //   const mastraRes = await fetch(`${MASTRA_URL}/api/agents/companyIdentifier/generate`, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({
  //       messages: [{ role: "user", content: parsed.query }]
  //     }),
  //   });

  //   if (!mastraRes.ok) {
  //     return NextResponse.json({ error: "Mastra APIエラー" }, { status: mastraRes.status });
  //   }
  //   const data = await mastraRes.json();
  //   if (typeof data.text === "string") {
  //     try {
  //       const parsed = JSON.parse(data.text);
  //       return NextResponse.json(parsed);
  //     } catch {
  //       // パースできなければそのまま返す
  //       return NextResponse.json(data);
  //     }
  //   }
  //   return NextResponse.json(data);
  // } catch (error) {
  //   if (error instanceof z.ZodError) {
  //     return NextResponse.json({ error: error.errors }, { status: 400 });
  //   }
  //   return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  // }
} 