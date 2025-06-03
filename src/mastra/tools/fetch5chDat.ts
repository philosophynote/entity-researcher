// ts-node で実行可能。Node20 以上なら fetch が標準で使えます
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import iconv from "iconv-lite";
import { openai } from "@ai-sdk/openai";

function parse5chUrl(
  url: string
): { host: string; board: string; key: string } | null {
  // itest.5ch.net/greta/test/read.cgi/poverty/1746103545/
  // asahi.5ch.net/test/read.cgi/newsplus/1747116664
  const m =
    url.match(
      /^https?:\/\/(?:(itest|(\w+))\.5ch\.net)\/(\w+)\/test\/read\.cgi\/(\w+)\/(\d+)/
    ) ||
    url.match(/^https?:\/\/(\w+)\.5ch\.net\/test\/read\.cgi\/(\w+)\/(\d+)/);
  if (m) {
    if (m.length === 6) {
      // itest.5ch.net/greta/test/read.cgi/poverty/1746103545/
      const host = m[2] ? `${m[2]}.5ch.net` : `${m[1]}.5ch.net`;
      const board = m[3];
      const key = m[4];
      return { host, board, key };
    } else if (m.length === 4) {
      // asahi.5ch.net/test/read.cgi/newsplus/1747116664
      const host = `${m[1]}.5ch.net`;
      const board = m[2];
      const key = m[3];
      return { host, board, key };
    }
  }
  return null;
}

/**
 * 5ch datスレッド取得・パースTool（URL入力対応）
 */
export const fetch5chDat = createTool({
  id: "fetch5chDat",
  description:
    "5chのスレッドURLを受け取り、datスレッドを取得し各レスを配列で返します",
  inputSchema: z.object({
    url: z
      .string()
      .url()
      .describe(
        "5chスレッドのURL（例: https://itest.5ch.net/greta/test/read.cgi/poverty/1746103545/）"
      ),
  }),
  outputSchema: z.object({
    posts: z.array(
      z.object({
        no: z.number().describe("レス番号"),
        name: z.string().describe("投稿者名"),
        mail: z.string().describe("メール欄"),
        date: z.string().describe("投稿日時"),
        id: z.string().describe("ID"),
        body: z.string().describe("本文"),
        title: z.string().describe("スレッドタイトル"),
      })
    ),
  }),
  execute: async ({ context: { url } }) => {
    const parsed = parse5chUrl(url);
    if (!parsed) {
      console.error("[fetch5chDat] URLパース失敗");
      throw new Error("5chスレッドURLの形式が正しくありません");
    }
    const { host, board, key } = parsed;
    const datUrl = `https://${host}/${board}/dat/${key}.dat`;
    let res;
    try {
      res = await fetch(datUrl, {
        headers: {
          "User-Agent": "Monazilla/1.00 (ChatGPT Example)",
        },
      });
    } catch (e) {
      console.error("[fetch5chDat] fetchリクエスト失敗", e);
      // 404以外のfetch失敗も含め、空配列で継続
      return { posts: [] };
    }
    if (!res.ok) {
      console.error("[fetch5chDat] dat取得失敗", res.status, res.statusText);
      // 404やその他エラー時も空配列で継続
      return { posts: [] };
    }

    // バイナリ取得 → SJIS → UTF-8
    const buf = Buffer.from(await res.arrayBuffer());
    const txt = iconv.decode(buf, "Shift_JIS");

    // 各レスをオブジェクト化
    const posts = txt
      .trim()
      .split("\n")
      .map((line, i) => {
        const [name, mail, dateId, body, title] = line.split("<>");
        const [date, id] = dateId.split(" ID:");
        return {
          no: i + 1,
          name,
          mail,
          date,
          id: id ?? "",
          body: body.replace(/<br>/g, "\n"),
          title,
        };
      });

    return { posts };
  },
});

/**
 * 投稿配列からbodyに企業名が含まれる投稿または類似投稿をベクトル検索で返すTool
 */
export const searchCompanyInPosts = createTool({
  id: "searchCompanyInPosts",
  description:
    "posts配列と企業名を受け取り、bodyに企業名が含まれる投稿または類似投稿をベクトル検索で返します",
  inputSchema: z.object({
    posts: z.array(
      z.object({
        no: z.number(),
        name: z.string(),
        mail: z.string(),
        date: z.string(),
        id: z.string(),
        body: z.string(),
        title: z.string(),
      })
    ),
    companyName: z.string().describe("検索対象の企業名"),
  }),
  outputSchema: z.object({
    hits: z.array(
      z.object({
        no: z.number(),
        name: z.string(),
        mail: z.string(),
        date: z.string(),
        id: z.string(),
        body: z.string(),
        title: z.string(),
        score: z.number().describe("類似度スコア"),
      })
    ),
  }),
  execute: async ({ context: { posts, companyName } }) => {
    // OpenAI埋め込みモデル
    const embeddingModel = openai.embedding("text-embedding-3-small");

    // 各bodyの埋め込みを一括生成
    const bodyTexts = posts.map((p) => p.body);
    const bodyEmbeddingRes = await embeddingModel.doEmbed({
      values: bodyTexts,
    });
    const bodyEmbeddings = bodyEmbeddingRes.embeddings;

    // クエリ（企業名）の埋め込み
    const queryEmbeddingRes = await embeddingModel.doEmbed({
      values: [companyName],
    });
    const queryEmbedding = queryEmbeddingRes.embeddings[0];

    // コサイン類似度計算関数
    function cosineSimilarity(a: number[], b: number[]): number {
      const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
      const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
      const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
      return dot / (normA * normB);
    }

    // 類似度でスコア付与
    const postsWithScore = posts.map((post, idx) => ({
      ...post,
      score: cosineSimilarity(bodyEmbeddings[idx], queryEmbedding),
    }));

    // 類似度0.8以上のみ返す
    const hits = postsWithScore
      .filter((p) => p.score >= 0.8)
      .sort((a, b) => b.score - a.score);

    return { hits };
  },
});
