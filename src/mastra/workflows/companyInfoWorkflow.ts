// src/workflows/company-info.ts
import { z } from "zod";
import { createWorkflow, createStep } from "@mastra/core/workflows/vNext";
import { companyDataAgent } from "../agents/companyDataAgent";
import { socialInsuranceAgent } from "../agents/socialInsuranceAgent";
import { prtimesAgent } from "../agents/prtimesAgent";
import { nikkeiAgent } from "../agents/nikkeiAgent";
// import { bulletinAgent } from "../agents/bulletinAgent";
import { fetchNewsAgent } from "../agents/fetchNewsAgent";
import { classifyRiskAgent } from "../agents/classifyRiskAgent";

/* --- I/O スキーマ -------------------------------------------------- */
const workflowInputSchema = z.object({
  corporateNumber: z.string(),
  name: z.string(),
  address: z.string(),
});

const workflowOutputSchema = z.object({
  basic: z.object({
    representative: z.string(),
    corporateUrl: z.string(),
    landingPages: z.array(z.string()),
    phone: z.string(),
    employees: z.number(),
    founded: z.string(),
    overview: z.string(),
  }),
  socialInsurance: z.object({
    insuredStatus: z.union([z.literal("加入中"), z.literal("未加入")]),
    insuredCount: z.number(),
  }),
  pressReleases: z.array(
    z.object({
      title: z.string(),
      date: z.string(),
      url: z.string(),
    }),
  ),
  news: z.array(
    z.object({
      title: z.string(),
      date: z.string(),
      url: z.string(),
    }),
  ),
  // bulletin: z.array(
  //   z.object({
  //     comment: z.string(),
  //     url: z.string(),
  //   }),
  // ),
  fetchNews: z.array(
    z.object({
      title: z.string(),
      publishDate: z.string(),
      url: z.string(),
    }),
  ),
});

/* --- Step 定義 ----------------------------------------------------- */
const makeBasicInfoPrompt = createStep({
  id: "makeBasicInfoPrompt",
  description:
    "法人番号・企業名・所在地から、企業情報収集エージェント向けのプロンプトを生成する",
  inputSchema: workflowInputSchema,
  outputSchema: z.object({ prompt: z.string() }),
  execute: async ({ inputData }) => ({
    prompt: `法人番号: ${inputData.corporateNumber}\n企業名: ${inputData.name}\n所在地: ${inputData.address}`,
  }),
});

const makeNamePrompt = createStep({
  id: "makeBasicInfoPrompt",
  description:
    "企業名を企業情報収集エージェント向けに渡す",
  inputSchema: workflowInputSchema,
  outputSchema: z.object({ prompt: z.string() }),
  execute: async ({ inputData }) => ({
    prompt: `${inputData.name}`,
  }),
});

const companyDataStep = createStep(companyDataAgent);
const socialInsuranceStep = createStep(socialInsuranceAgent);
const prtimesStep = createStep(prtimesAgent);
const nikkeiNewsStep = createStep(nikkeiAgent);
// const bulletinStep = createStep(bulletinAgent);
const fetchNewsStep = createStep(fetchNewsAgent);
const classifyRiskStep = createStep({
  id: "classifyRiskStep",
  description: "プレスリリースURLごとにリスク判定を実施",
  inputSchema: z.object({
    pressReleases: z.array(
      z.object({
        title: z.string(),
        date: z.string(),
        url: z.string(),
      })
    ),
  }),
  outputSchema: z.array(
    z.object({
      url: z.string(),
      label: z.string(),
      reason: z.string(),
    })
  ),
  execute: async ({ inputData }) => {
    const results = [];
    for (const pr of inputData.pressReleases) {
      // URLをそのままuserメッセージとして渡す
      const res = await classifyRiskAgent.generate([`URL: ${pr.url}`]);
      // 返却値のtextからラベルと理由を抽出
      const text = res.text || "";
      const labelMatch = text.match(/ラベル[:：]\s*(\S+)/);
      const reasonMatch = text.match(/理由[:：]\s*([^\n]+)/);
      results.push({
        url: pr.url,
        label: labelMatch ? labelMatch[1] : "",
        reason: reasonMatch ? reasonMatch[1] : text,
      });
    }
    return results;
  },
});

const parsePressReleasesStep = createStep({
  id: "parsePressReleasesStep",
  inputSchema: z.object({ text: z.string() }),
  outputSchema: z.object({
    pressReleases: z.array(z.object({
      title: z.string(),
      date: z.string(),
      url: z.string(),
    })),
  }),
  execute: async ({ inputData }) => ({
    pressReleases: JSON.parse(inputData.text),
  }),
});

const aggregateResultsStep = createStep({
  id: "aggregateResults",
  description: "前のステップの出力を集約してワークフローの出力スキーマに適合させる",
  inputSchema: z.object({ text: z.string() }),
  outputSchema: workflowOutputSchema,
  execute: async (params) => {
    const ctx = (params as any).context;
    return {
      basic: ctx.steps[companyDataStep.id as string].output,
      socialInsurance: ctx.steps[socialInsuranceStep.id as string].output,
      pressReleases: ctx.steps[prtimesStep.id as string].output,
      news: ctx.steps[nikkeiNewsStep.id as string].output,
      fetchNews: ctx.steps[fetchNewsStep.id as string].output,
    } as z.infer<typeof workflowOutputSchema>;
  },
});

/* --- Workflow ------------------------------------------------------ */
const _workflow = createWorkflow({
  id: "company-info-workflow",
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  steps: [
    makeNamePrompt,
    makeBasicInfoPrompt,
    companyDataStep,
    socialInsuranceStep,
    prtimesStep,
    parsePressReleasesStep,
    classifyRiskStep,
    nikkeiNewsStep,
    // bulletinStep,
    fetchNewsStep,
    aggregateResultsStep,
  ],
})

export const companyInfoWorkflow = _workflow
  .then(makeNamePrompt)
  .map({ prompt: { step: makeNamePrompt, path: "prompt" } })
  .then(prtimesStep)
  .map({ text: { step: prtimesStep, path: "text" } })
  .then(parsePressReleasesStep)
  .map({ pressReleases: { step: parsePressReleasesStep, path: "pressReleases" } })
  .then(classifyRiskStep)
  .map({ prompt: { step: makeNamePrompt, path: "prompt" } })
  // .then(socialInsuranceStep)
  // .map({ prompt: { step: makeBasicInfoPrompt, path: "prompt" } })
  .commit();

