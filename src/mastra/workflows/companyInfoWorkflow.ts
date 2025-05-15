import { Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { companyDataAgent } from '../agents/companyDataAgent';
import { socialInsuranceAgent } from '../agents/socialInsuranceAgent';
import { prtimesAgent } from '../agents/prtimesAgent';
import { nikkeiAgent } from '../agents/nikkeiAgent';
import { fetchNewsAgent } from '../agents/fetchNewsAgent';
import { openworkAgent } from '../agents/openworkAgent';
import { bulletinAgent } from '../agents/bulletinAgent';

// ワークフロー型注釈用
const workflowId = "company-info-collection-vnext" as const;
const workflowInputSchema = z.object({
  corporateNumber: z.string(),
  name: z.string(),
  address: z.string(),
});
const workflowOutputSchema = z.object({
  basic: z.any(),
  insurance: z.any(),
  pressReleases: z.any(),
  news: z.any(),
  reviews: z.any(),
  bulletin: z.any(),
});

type WorkflowInput = z.infer<typeof workflowInputSchema>;
type WorkflowOutput = z.infer<typeof workflowOutputSchema>;

// プロンプト生成Step（企業基本情報）
import { createStep } from "@mastra/core/workflows/vNext";
const makeBasicInfoPrompt = createStep({
  id: "makeBasicInfoPrompt",
  inputSchema: workflowInputSchema,
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

// WorkflowクラスでvNextワークフローを定義
export const workflow: Workflow = new Workflow({
  name: workflowId,
  triggerSchema: workflowInputSchema,
})
  // 基本情報プロンプト生成
  .step(makeBasicInfoPrompt)
  // 企業基本情報取得
  .step(gatherBasicInfo, {
    variables: {
      prompt: { step: makeBasicInfoPrompt, path: 'prompt' },
    },
  })
  // 社会保険プロンプト生成
  .step(makeInsurancePrompt, {
    variables: {
      corporateNumber: { step: 'trigger', path: 'corporateNumber' },
    },
  })
  // 社会保険情報取得
  .step(gatherInsurance, {
    variables: {
      prompt: { step: makeInsurancePrompt, path: 'prompt' },
    },
  })
  // 企業名プロンプト生成
  .step(makeNamePrompt, {
    variables: {
      name: { step: 'trigger', path: 'name' },
    },
  })
  // 並列分岐
  .after(makeNamePrompt)
    .step(gatherPressReleases, {
      variables: {
        prompt: { step: makeNamePrompt, path: 'prompt' },
      },
    })
    .step(gatherNikkeiNews, {
      variables: {
        prompt: { step: makeNamePrompt, path: 'prompt' },
      },
    })
    .step(gatherApiNews, {
      variables: {
        prompt: { step: makeNamePrompt, path: 'prompt' },
      },
    })
    .step(gatherReviews, {
      variables: {
        prompt: { step: makeNamePrompt, path: 'prompt' },
      },
    })
    .step(gatherBulletin, {
      variables: {
        prompt: { step: makeNamePrompt, path: 'prompt' },
      },
    })
  // 集約ステップ
  .after([
    gatherPressReleases,
    gatherNikkeiNews,
    gatherApiNews,
    gatherReviews,
    gatherBulletin,
  ])
  .step({
    id: "aggregateResult",
    outputSchema: workflowOutputSchema,
    /**
     * 各ステップの出力を集約して返却
     */
    async execute({ context }): Promise<WorkflowOutput> {
      return {
        basic: context.steps.gatherBasicInfo.output.text,
        insurance: context.steps.gatherInsurance.output.text,
        pressReleases: context.steps.gatherPressReleases.output.text,
        news: context.steps.gatherNikkeiNews.output.text,
        reviews: context.steps.gatherReviews.output.text,
        bulletin: context.steps.gatherBulletin.output.text,
      };
    },
  })
  .commit();
