import { createLogger } from "@mastra/core/logger";
import { Mastra } from "@mastra/core";
import { companyIdentifierAgent } from "./agents/companyIdentifierAgent";
import { companyDataAgent } from "./agents/companyDataAgent";
import { socialInsuranceAgent } from "./agents/socialInsuranceAgent";
import { fetchNewsAgent } from "./agents/fetchNewsAgent";
import { classifyRiskAgent } from "./agents/classifyRiskAgent";
import { bulletinAgent } from "./agents/bulletinAgent";
import { classifyIndustryAgent } from "./agents/classifyIndustryAgent";
import { prAndNewsParallelWorkflow } from "./workflows/prAndNewsParallelWorkflow";
import { companyDataWorkflow } from "./workflows/companyDataWorkflow";
import { fullCompanyWorkflow } from "./workflows/fullCompanyWorkflow";

export const mastra = new Mastra({
  agents: {
    companyIdentifier: companyIdentifierAgent,
    companyData: companyDataAgent,
    socialInsuranceAgent: socialInsuranceAgent,
    fetchNewsAgent: fetchNewsAgent,
    classifyRiskAgent: classifyRiskAgent,
    bulletinAgent: bulletinAgent,
    classifyIndustryAgent: classifyIndustryAgent,
  },
  workflows: {
    prAndNewsParallelWorkflow,
    companyDataWorkflow,
    fullCompanyWorkflow,
  },
  logger: createLogger({
    name: "Mastra",
    level: "debug",
  }),
});
