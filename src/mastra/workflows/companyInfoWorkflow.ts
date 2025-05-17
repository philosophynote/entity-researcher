// src/workflows/company-info.ts
import { z } from "zod";
import { createWorkflow, createStep } from "@mastra/core/workflows/vNext";
import { companyDataAgent } from "../agents/companyDataAgent";

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

const companyDataStep = createStep(companyDataAgent);

/* --- Workflow ------------------------------------------------------ */
const _workflow = createWorkflow({
  id: "company-info-collection-vnext",
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  steps: [makeBasicInfoPrompt, companyDataStep],
})

export const companyInfoWorkflow = _workflow
  .then(makeBasicInfoPrompt)   // 処理の順序を明示
  .map({
    prompt: { step: makeBasicInfoPrompt, path: "prompt" }
  })
  .then(companyDataStep)
  .commit();                   // ← これを忘れると UI に出ない

