import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { mcp } from '../mcp';

/**
 * 法人番号から社会保険加入状況と被保険者数を取得するツール（Playwright MCP経由）
 */
export const searchSocialInsurance = createTool({
  id: 'searchSocialInsurance',
  description: '法人番号で社会保険加入状況と被保険者数をPlaywright MCP経由で取得します',
  inputSchema: z.object({
    corporateNumber: z.string().describe('法人番号'),
  }),
  outputSchema: z.object({
    insuredStatus: z.union([z.literal('加入中'), z.literal('未加入')]),
    insuredCount: z.number().describe('被保険者数'),
  }),
  execute: async ({ context: { corporateNumber } }) => {
    // Playwright MCPツールを取得
    const tools = await mcp.getTools();
    console.log(tools);
    // Playwright MCPのbrowseツール名（仮: 'playwright_browse'）
    const browse = tools['playwright_browse'];
    if (!browse) throw new Error('Playwright MCPのbrowseツールが見つかりません');

    // 指示文を作成（socialInsuranceAgent.tsのinstructionsを参考）
    const prompt = `
      1. https://www2.nenkin.go.jp/do/search_section/ にアクセス
      2. 検索条件を法人番号検索に設定
      3. 検索フォームに法人番号「${corporateNumber}」を入力して検索
      4. 検索結果がない場合は加入状況は未加入
      5. 検索結果がある場合は加入状況は加入中と見做して、被保険者数を取得
      6. 結果をJSONで { insuredStatus: "加入中"|"未加入", insuredCount: 数値 } の形で返す
    `;

    // Playwright MCPでブラウザ自動操作
    const result = await browse({ prompt });
    console.log(result);
    // 結果のJSONパース
    let insuredStatus: '加入中' | '未加入' = '未加入';
    let insuredCount = 0;
    try {
      if (typeof result === 'string') {
        const parsed = JSON.parse(result);
        insuredStatus = parsed.insuredStatus;
        insuredCount = parsed.insuredCount;
      } else if (result && typeof result === 'object') {
        insuredStatus = result.insuredStatus;
        insuredCount = result.insuredCount;
      }
    } catch (e) {
      throw new Error('Playwright MCPの応答パースに失敗しました: ' + String(e));
    }
    return { insuredStatus, insuredCount } as const;
  },
});