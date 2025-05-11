import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * 企業情報取得API 入力スキーマ
 */
const CompanyInfoInputSchema = z.object({
  corporateNumber: z.string().min(1, '法人番号は必須です'),
});

export type CompanyInfoInput = z.infer<typeof CompanyInfoInputSchema>;

/**
 * 企業情報取得API 出力スキーマ
 * 要件定義書の項目に従う
 */
const CompanyInfoOutputSchema = z.object({
  corporateNumber: z.string(),
  name: z.string(),
  address: z.string(),
  corporateUrl: z.string().url(),
  lpUrl: z.string().url(),
  industry: z.string(), // jis_industry_classification.yamlのsubcategoriesから選択
  phone: z.string(),
  employees: z.string(),
  established: z.string(),
  summary: z.string().max(100),
  socialInsurance: z.object({
    joined: z.boolean(),
    insuredCount: z.number(),
    sourceUrl: z.string().url(),
  }),
  pressReleases: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    date: z.string(),
    sourceUrl: z.string().url(),
  })),
  news: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    date: z.string(),
    sourceUrl: z.string().url(),
  })),
  reviews: z.array(z.object({
    site: z.string(),
    title: z.string(),
    url: z.string().url(),
    summary: z.string(),
    sourceUrl: z.string().url(),
  })),
  anonymousBoard: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    summary: z.string(),
    sourceUrl: z.string().url(),
  })),
});

export type CompanyInfoOutput = z.infer<typeof CompanyInfoOutputSchema>;

/**
 * POST: 企業情報取得
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CompanyInfoInputSchema.parse(body);

    // TODO: Mastra/Perplexity/Playwright MCPサーバー連携で情報取得
    // 現状はダミーデータを返却
    const dummy: CompanyInfoOutput = {
      corporateNumber: parsed.corporateNumber,
      name: 'サンプル株式会社',
      address: '東京都千代田区1-1-1',
      corporateUrl: 'https://sample.co.jp',
      lpUrl: 'https://sample.co.jp/lp',
      industry: '39: 情報サービス業',
      phone: '03-1234-5678',
      employees: '100',
      established: '2000-01-01',
      summary: 'サンプル株式会社はITサービスを提供する企業です。',
      socialInsurance: {
        joined: true,
        insuredCount: 80,
        sourceUrl: 'https://www2.nenkin.go.jp/do/search_section/',
      },
      pressReleases: [
        {
          title: '新サービスリリース',
          url: 'https://prtimes.jp/sample1',
          date: '2024-05-01',
          sourceUrl: 'https://prtimes.jp/',
        },
      ],
      news: [
        {
          title: '日経新聞に掲載',
          url: 'https://www.nikkei.com/sample1',
          date: '2024-04-20',
          sourceUrl: 'https://www.nikkei.com/',
        },
      ],
      reviews: [
        {
          site: 'openwork',
          title: '働きやすい環境',
          url: 'https://www.openwork.jp/sample1',
          summary: '風通しの良い社風です。',
          sourceUrl: 'https://www.openwork.jp/',
        },
      ],
      anonymousBoard: [
        {
          title: '5chスレッド例',
          url: 'https://itest.5ch.net/sample1',
          summary: '5chでの評判まとめ',
          sourceUrl: 'https://itest.5ch.net/',
        },
      ],
    };
    CompanyInfoOutputSchema.parse(dummy); // 型検証
    return NextResponse.json(dummy);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
} 