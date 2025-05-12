import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { mcp } from '../mcp';

export const prTimesSearch = createTool({
  id: 'prTimesSearch',
  description: 'PR TIMES から企業のプレスリリース情報を取得します',
  inputSchema: z.object({
    companyName: z.string().describe('企業名'),
  }),
  outputSchema: z
    .array(
      z.object({
        title: z.string().describe('プレスリリースタイトル'),
        date: z.string().describe('リリース日 (YYYY-MM-DD)'),
        url: z.string().describe('リリースURL'),
      }),
    )
    .describe('プレスリリース情報の配列'),
  execute: async ({ context: { companyName } }) => {
    /* ==== Playwright MCP ツールハンドル取得 ==== */
    const tools = await mcp.getTools();
    const navigate = tools["playwright_browser_navigate"];
    const waitFor = tools["playwright_page_wait_for"];
    const fill = tools["playwright_page_fill"];
    const press = tools["playwright_keyboard_press"];
    const evaluate = tools["playwright_page_evaluate"];
    console.log("prTimesSearch")
    /* ==== 1. TOP へアクセス ==== */
    await navigate({ url: 'https://prtimes.jp/' });
    await waitFor({ selector: 'input[name="search_word"]' });
    console.log("prTimesSearch 1")
    /* ==== 2. キーワード検索 ==== */
    await fill({ selector: 'input[name="search_word"]', text: companyName });
    await press({ key: 'Enter' });
    console.log("prTimesSearch 2")

    /* 検索結果ページのロード待ち */
    await waitFor({ selector: 'time.date' }); // 各カードの日付要素
    console.log("prTimesSearch 3")
    /* ==== 3. 直近 6 か月分を抽出 ==== */
    const todayISO = '2025-05-11';
    const news = await evaluate({
      // ブラウザ側で実行する関数
      fn: ({
        todayISO,
      }: {
        todayISO: string;
      }): { title: string; date: string; url: string }[] => {
        /* 日付範囲計算 */
        const today = new Date(todayISO);
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(today.getMonth() - 6);

        const results: { title: string; date: string; url: string }[] = [];
        document.querySelectorAll('time.date').forEach((timeEl) => {
          const raw = timeEl.textContent?.trim() ?? '';
          const m = raw.match(/(\d{4})年(\d{2})月(\d{2})日/);
          if (!m) return;

          const [_, y, mo, d] = m;
          const iso = `${y}-${mo}-${d}`;
          const dt = new Date(iso);
          if (dt < sixMonthsAgo || dt > today) return;

          const cardAnchor =
            timeEl.closest<HTMLAnchorElement>('a') ||
            timeEl.parentElement?.closest<HTMLAnchorElement>('a');
          if (!cardAnchor) return;

          const titleEl =
            cardAnchor.querySelector<HTMLElement>('.list-title') ||
            cardAnchor.querySelector<HTMLElement>('h3');
          const title = titleEl?.textContent?.trim() ?? '';
          const url = cardAnchor.href;

          if (title && url) results.push({ title, date: iso, url });
        });
        return results;
      },
      args: { todayISO },
    });

    /* ==== 4. 出力 ==== */
    // outputSchema に合わせて配列のみ返す
    return news;
  },
});
