import { createLogger } from "@mastra/core/logger";
import { Mastra } from '@mastra/core';
import { companyIdentifierAgent } from './agents/companyIdentifierAgent';
import { browserAutomationAgent } from './agents/browserAutomationAgent';
import { companyDataAgent } from './agents/companyDataAgent';
import { companyInfoWorkflow } from './workflows/companyInfoWorkflow';
import { prtimesAgent } from './agents/prtimesAgent';
import { nikkeiAgent } from './agents/nikkeiAgent';
import { threadAgent } from './agents/threadAgent';
import { socialInsuranceAgent } from './agents/socialInsuranceAgent';
import { fetchNewsAgent } from './agents/fetchNewsAgent';

export const mastra = new Mastra({
  agents: {
    companyIdentifier: companyIdentifierAgent,
    browserAutomation: browserAutomationAgent,
    companyData: companyDataAgent,
    prtimesAgent: prtimesAgent,
    nikkeiAgent: nikkeiAgent,
    threadAgent: threadAgent,
    socialInsuranceAgent: socialInsuranceAgent,
    fetchNewsAgent: fetchNewsAgent,
  },
  workflows: {
    companyInfoWorkflow,
  },
  logger: createLogger({
    name: "Mastra",
    level: "debug",
  }),
});
        