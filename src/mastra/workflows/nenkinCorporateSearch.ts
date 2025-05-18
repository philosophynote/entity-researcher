import { createWorkflow, createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import { browserAgent } from '../agents/browserAgent';
import { parse } from 'node-html-parser';

/**
 * 社会保険加入状況を取得するワークフロー
 */
const searchStep = createStep({
  id: 'search',
  inputSchema: z.object({ corporateNumber: z.string().length(13) }),
  outputSchema: z.object({ text: z.string() }),
  async execute({ inputData }) {
    // browserAgentのgenerateでプロンプトを渡してHTMLを取得
    const prompt = `
      1) https://www2.nenkin.go.jp/do/search_section/ に移動。
      2) 法人番号で検索するのラジオボタンを操作して、検索方法を法人番号に設定する。
      3) 法人番号入力欄を探し、値「${inputData.corporateNumber}」を入力。
      4) 「検索実行」と書かれたボタンをクリック。
      5) 結果テーブルが表示されるまで待機し、ページ HTML を返す。
      返却形式: 取得した outerHTML 全体のみ。
    `;
    const res = await browserAgent.generate([{ role: 'user', content: prompt }]);
    return { text: res.text ?? '' };
  },
});

const parseStep = createStep({
  id: 'parse',
  inputSchema: z.object({ text: z.string() }),
  outputSchema: z.object({
    insuredStatus: z.union([z.literal('加入中'), z.literal('未加入')]),
    insuredCount: z.number(),
  }),
  async execute({ inputData }) {
    const doc = parse(inputData.text);

    // テーブルのtheadから「被保険者数」の列indexを特定
    const ths = doc.querySelectorAll('table thead tr th');
    const insuredCountIndex = ths.findIndex(th => th.innerText.includes('被保険者数'));
    if (insuredCountIndex === -1) {
      // 列が見つからなければ0人扱い
      return { insuredStatus: '未加入', insuredCount: 0 } as const;
    }

    // tbodyの最初のtrから該当列の値を取得
    const firstRow = doc.querySelector('table tbody tr');
    if (!firstRow) {
      return { insuredStatus: '未加入', insuredCount: 0 } as const;
    }
    const tds = firstRow.querySelectorAll('td');
    const countText = tds[insuredCountIndex]?.innerText ?? '';
    const count = parseInt(countText.replace(/[^0-9]/g, ''), 10);

    // 件数が1件以上なら「加入中」
    return {
      insuredStatus: count > 0 ? '加入中' : '未加入',
      insuredCount: count || 0,
    } as const;
  },
});

export const nenkinCorporateSearch = createWorkflow({
  id: 'nenkin-corporate-search',
  inputSchema: z.object({ corporateNumber: z.string().length(13) }),
  outputSchema: z.object({
    insuredStatus: z.union([z.literal('加入中'), z.literal('未加入')]),
    insuredCount: z.number(),
  }),
})
  .then(searchStep)
  .map({
    text: { step: searchStep, path: 'text' }
  })
  .then(parseStep)
  .map({
    insuredStatus: { step: parseStep, path: 'insuredStatus' },
    insuredCount: { step: parseStep, path: 'insuredCount' }
  })
  .commit();
