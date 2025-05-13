import { createWorkflow, createStep } from "@mastra/core/workflows/vNext";
import { z } from "zod";
import { companyDataAgent } from '../agents/companyDataAgent';
import { socialInsuranceAgent } from '../agents/socialInsuranceAgent';
import { prtimesAgent } from '../agents/prtimesAgent';
import { nikkeiAgent } from '../agents/nikkeiAgent';
import { fetchNewsAgent } from '../agents/fetchNewsAgent';
import { openworkAgent } from '../agents/openworkAgent';
import { bulletinAgent } from '../agents/bulletinAgent';

// プロンプト生成Step（企業基本情報）
const makeBasicInfoPrompt = createStep({
  id: "makeBasicInfoPrompt",
  inputSchema: z.object({
    corporateNumber: z.string(),
    name: z.string(),
    address: z.string(),
  }),
  outputSchema: z.object({ prompt: z.string() }),
  async execute({ inputData }) {
    return {
      prompt: `法人番号: ${inputData.corporateNumber}\n企業名: ${inputData.name}\n所在地: ${inputData.address}`,
    };
  },
});
const gatherBasicInfo = createStep(companyDataAgent);

// プロンプト生成Step（社会保険）
const makeInsurancePrompt = createStep({
  id: "makeInsurancePrompt",
  inputSchema: z.object({ corporateNumber: z.string() }),
  outputSchema: z.object({ prompt: z.string() }),
  async execute({ inputData }) {
    return { prompt: `法人番号: ${inputData.corporateNumber}` };
  },
});
const gatherInsurance = createStep(socialInsuranceAgent);

// プロンプト生成Step（企業名のみ）
const makeNamePrompt = createStep({
  id: "makeNamePrompt",
  inputSchema: z.object({ name: z.string() }),
  outputSchema: z.object({ prompt: z.string() }),
  async execute({ inputData }) {
    return { prompt: inputData.name };
  },
});
const gatherPressReleases = createStep(prtimesAgent);
const gatherNikkeiNews = createStep(nikkeiAgent);
const gatherApiNews = createStep(fetchNewsAgent);
const gatherReviews = createStep(openworkAgent);
const gatherBulletin = createStep(bulletinAgent);

const workflow = createWorkflow({
  id: "company-info-collection-vnext",
  inputSchema: z.object({
    corporateNumber: z.string(),
    name: z.string(),
    address: z.string(),
  }),
  outputSchema: z.object({
    basic: z.any(),
    insurance: z.any(),
    pressReleases: z.any(),
    news: z.any(),
    reviews: z.any(),
    bulletin: z.any(),
  }),
  steps: [
    makeBasicInfoPrompt,
    gatherBasicInfo,
    makeInsurancePrompt,
    gatherInsurance,
    makeNamePrompt,
    gatherPressReleases,
    gatherNikkeiNews,
    gatherApiNews,
    gatherReviews,
    gatherBulletin,
  ],
})
  // 企業基本情報
  .then(makeBasicInfoPrompt)
  .map({ prompt: { step: makeBasicInfoPrompt, path: "prompt" } })
  .then(gatherBasicInfo)
  // 社会保険
  .map({ corporateNumber: { step: makeBasicInfoPrompt, path: "corporateNumber" } })
  .then(makeInsurancePrompt)
  .map({ prompt: { step: makeInsurancePrompt, path: "prompt" } })
  .then(gatherInsurance)
  // プレスリリース・ニュース・口コミ・掲示板は企業名のみ必要
  .map({ name: { step: makeBasicInfoPrompt, path: "name" } })
  .then(makeNamePrompt)
  .map({ prompt: { step: makeNamePrompt, path: "prompt" } })
  .parallel([
    gatherPressReleases,
    gatherNikkeiNews,
    gatherApiNews,
    gatherReviews,
    gatherBulletin,
  ])
  .map({
    basic: { step: gatherBasicInfo, path: "text" },
    insurance: { step: gatherInsurance, path: "text" },
    pressReleases: { step: gatherPressReleases, path: "text" },
    news: { step: gatherNikkeiNews, path: "text" }, // 必要に応じてAPIニュースも統合可
    reviews: { step: gatherReviews, path: "text" },
    bulletin: { step: gatherBulletin, path: "text" },
  });

export const companyInfoWorkflow = workflow.commit(); 