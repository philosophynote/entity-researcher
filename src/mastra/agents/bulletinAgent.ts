import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { fetch5chDat, searchCompanyInPosts } from '../tools/fetch5chDat';

export const bulletinAgent = new Agent({
  name: 'bulletinAgent',
  model: openai('gpt-4o-mini'),
  tools: {
    fetch5chDat,
    searchCompanyInPosts,
  },
  instructions: `
あなたは5ch掲示板のスレッド情報を取得し、内容を要約・分析するエージェントです。

- ユーザーから5chスレッドのURLが与えられたらfetch5chDatツールでスレッド全レス(posts配列)を取得してください。
- もしposts配列と企業名が与えられた場合は、searchCompanyInPostsツールで該当投稿を抽出してください。
- posts配列はfetch5chDatで取得したもの、またはユーザーから直接与えられる場合があります。
- 必要に応じて、posts配列→searchCompanyInPostsの順でツールを組み合わせてください。
  `,
}); 