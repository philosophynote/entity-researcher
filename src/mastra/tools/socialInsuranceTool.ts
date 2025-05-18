import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { parse } from 'node-html-parser';

/**
 * 法人番号から社会保険加入状況と被保険者数を取得するツール
 */
export const searchSocialInsurance = createTool({
  id: 'searchSocialInsurance',
  description: '法人番号で社会保険加入状況と被保険者数を取得します',
  inputSchema: z.object({
    corporateNumber: z.string().describe('法人番号'),
  }),
  outputSchema: z.object({
    insuredStatus: z.union([z.literal('加入中'), z.literal('未加入')]),
    insuredCount: z.number().describe('被保険者数'),
  }),
  execute: async ({ context: { corporateNumber } }) => {
    // 1. 検索フォーム取得
    const getRes = await fetch('https://www2.nenkin.go.jp/do/search_section', {
      method: 'GET',
      credentials: 'include',
    });
    if (!getRes.ok) throw new Error(`フォーム取得失敗: ${getRes.status}`);
    const html = await getRes.text();

    // 2. フォーム要素抽出
    const doc = parse(html);
    const form = doc.querySelector('form');
    if (!form) throw new Error('検索フォームが見つかりませんでした');
    const action = form.getAttribute('action');
    if (!action) throw new Error('form action が見つかりません');

    // 3. input 値を組み立て
    const params = new URLSearchParams();
    for (const input of form.querySelectorAll('input[name]')) {
      const name = input.getAttribute('name') ?? '';
      const value = input.getAttribute('value') ?? '';
      params.append(name, name === 'houjinNumber' ? corporateNumber : value);
    }

    // 4. 検索実行
    const postRes = await fetch(action.startsWith('http') ? action : `https://www2.nenkin.go.jp${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      credentials: 'include',
    });
    if (!postRes.ok) throw new Error(`検索失敗: ${postRes.status} ${postRes.statusText}`);

    // 5. 結果解析
    const resultHtml = await postRes.text();
    const resultDoc = parse(resultHtml);
    const bodyText = resultDoc.innerText;
    if (/該当.*ありません/.test(bodyText)) {
      return { insuredStatus: '未加入', insuredCount: 0 } as const;
    }
    const countMatch = bodyText.match(/被保険者数[^\d]*(\d+)/);
    const count = countMatch ? parseInt(countMatch[1], 10) : 0;
    return { insuredStatus: '加入中', insuredCount: count } as const;
  },
});
