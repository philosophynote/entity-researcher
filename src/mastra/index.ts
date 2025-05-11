import { createLogger } from "@mastra/core/logger";
import { Mastra } from '@mastra/core';
import { companyIdentifierAgent } from './agents/companyIdentifierAgent';
import { browserAutomationAgent } from './agents/browserAutomationAgent';
import { companyDataAgent } from './agents/companyDataAgent';
import { companyInfoWorkflow } from './workflows/companyInfoWorkflow';


export const mastra = new Mastra({
  agents: {
    companyIdentifier: companyIdentifierAgent,
    browserAutomation: browserAutomationAgent,
    companyData: companyDataAgent,
  },
  workflows: {
    companyInfoWorkflow,
  },
  logger: createLogger({
    name: "Mastra",
    level: "debug",
  }),
});
        