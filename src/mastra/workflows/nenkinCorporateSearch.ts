import { createWorkflow, createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import { browserAgent } from '../agents/browserAgent';
import { parse } from 'node-html-parser';

/**
 * 社会保険加入状況を取得するワークフロー
 */
export const nenkinCorporateSearch = createWorkflow({
  id: 'nenkin-corporate-search',
  inputSchema: z.object({ corporateNumber: z.string().length(13) }),
  outputSchema: z.object({
    insuredStatus: z.union([z.literal('加入中'), z.literal('未加入')]),
    insuredCount: z.number(),
  }),
})
  // ステップ 1: ページ遷移＋検索実行
  .step(
    'search',
    createStep({
      agent: browserAgent,
      prompt: ({ corporateNumber }) => `
        1) https://www2.nenkin.go.jp/do/search_section/ に移動。
        2) ページ内で aria-label または placeholder が「法人番号」に相当する入力欄を探し、
           値「${corporateNumber}」を入力。
        3) 「検索実行」と書かれたボタンをクリック。
        4) 結果テーブルが表示されるまで待機し、ページ HTML を返す。
        返却形式: 取得した outerHTML 全体のみ。
      `,
    }),
  )
  // ステップ 2: HTML を解析し加入状況を抽出
  .step(
    'parse',
    createStep({
      inputSchema: z.object({ text: z.string() }),
      outputSchema: z.object({
        insuredStatus: z.union([z.literal('加入中'), z.literal('未加入')]),
        insuredCount: z.number(),
      }),
      execute: async ({ inputData }) => {
        const doc = parse(inputData.text);
        const bodyText = doc.innerText;
        if (/該当.*ありません/.test(bodyText)) {
          return { insuredStatus: '未加入', insuredCount: 0 } as const;
        }
        const countMatch = bodyText.match(/被保険者数[^\d]*(\d+)/);
        const count = countMatch ? parseInt(countMatch[1], 10) : 0;
        return { insuredStatus: '加入中', insuredCount: count } as const;
      },
    }),
  )
  // ワークフローの最終出力にマッピング
  .map(({ parse }) => parse);
