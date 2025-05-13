import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fetch from "node-fetch";
import { parse, HTMLElement } from "node-html-parser";

/**
 * PRTIMESのURLからサブタイトルと本文を抽出するツール
 */
export const prtimesExtract = createTool({
  id: 'prtimesExtract',
  description: 'PRTIMESのURLからサブタイトルと本文を抽出します',
  inputSchema: z.object({
    url: z.string().url().describe('PRTIMES記事のURL')
  }),
  outputSchema: z.object({
    subtitle: z.string().describe('記事のサブタイトル'),
    body: z.string().describe('記事本文')
  }),
  execute: async ({ context: { url } }) => {
    const [subtitle, body] = await scrapeSubTitleAndBody(url);
    return { subtitle, body };
  },
});

/**
 * 指定URLからサブタイトルと本文を抽出する
 * @param url 対象のURL
 * @param shouldNotify エラー時に通知するか（現状はconsoleのみ）
 * @returns [サブタイトル, 本文]（どちらか取得失敗時は空文字）
 */
export async function scrapeSubTitleAndBody(
  url: string,
  shouldNotify = false
): Promise<[string, string]> {
  let attempts = 0;
  const MAX_RETRY = 3;
  let lastError: unknown = null;

  // セレクタ定義（必要に応じて調整）
  const STYLE = "style";
  const SUB_TITLE = "h2 span";
  const COMPANY_NAME = ".company-name";
  const BODY = "#press-release-body";
  const COMPANY_OVERVIEW = 'div[class^="press-release-layout_bottoms"]';

  while (attempts < MAX_RETRY) {
    try {
      // HTML取得
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (res.status === 404) {
        console.error(`404 Not Found: URL=${url}`);
        return ["", ""];
      }
      const html = await res.text();
      // node-html-parserでパース
      const root = parse(html);

      // styleタグを削除
      root.querySelectorAll(STYLE).forEach((el: HTMLElement) => el.remove());

      const tmpSubTitle = root.querySelector(SUB_TITLE)?.textContent ?? "";
      const companyName = root.querySelector(COMPANY_NAME)?.textContent ?? "";
      const bodyNode = root.querySelector(BODY);
      if (!bodyNode) {
        throw new Error("BODY selector returned empty");
      }
      const tmpBody = bodyNode.textContent ?? "";
      const companyOverview = root.querySelector(COMPANY_OVERVIEW);
      const overviewCompanyName = scrapeOverviewCompanyName(companyOverview);
      const representativeName = scrapeRepresentativeName(companyOverview);

      // サブタイトル・本文の整形
      const subTitle = tmpSubTitle.replace(/[\n\s　]/g, "").replace(/&nbsp/g, "");
      const body = `【${companyName}】${tmpBody}【${overviewCompanyName}】【${representativeName}】`
        .replace(/[\n\s　]/g, "")
        .replace(/&nbsp/g, "");
      return [subTitle, body];
    } catch (e) {
      lastError = e;
      attempts++;
      if (e instanceof Error && e.message.includes("BODY selector returned empty")) {
        console.error(`BodyMissingError: URL=${url}`);
        if (!shouldNotify) return ["", ""];
        if (attempts < MAX_RETRY) {
          console.warn(`BodyMissingError リトライ ${attempts}/${MAX_RETRY}: URL=${url}, error=${e.message}`);
          await new Promise((r) => setTimeout(r, 2 ** attempts * 1000));
          continue;
        } else {
          console.error(`BodyMissingError が連続したため処理をスキップ: URL=${url}, error=${e.message}`);
          return ["", ""];
        }
      } else {
        if (shouldNotify) {
          // 通知処理を追加する場合はここに
        } else {
          console.error(`記事の取得またはパースに失敗しました: ${e instanceof Error ? e.message : e}`);
        }
        return ["", ""];
      }
    }
  }
  return ["", ""];
}

/**
 * 会社概要から会社名を抽出（仮実装: 適宜修正）
 */
function scrapeOverviewCompanyName(companyOverview: HTMLElement | null): string {
  if (!companyOverview) return "";
  const name = companyOverview.querySelector(".name");
  return name?.textContent ?? "";
}

/**
 * 会社概要から代表者名を抽出（仮実装: 適宜修正）
 */
function scrapeRepresentativeName(companyOverview: HTMLElement | null): string {
  if (!companyOverview) return "";
  const rep = companyOverview.querySelector(".rep");
  return rep?.textContent ?? "";
}
