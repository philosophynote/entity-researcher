import { createLogger } from "@mastra/core/logger";
import { Mastra } from '@mastra/core';
import { companyIdentifierAgent } from './agents/companyIdentifierAgent';
import { browserAutomationAgent } from './agents/browserAutomationAgent';
import { companyInfoWorkflow } from './workflows/companyInfoWorkflow';

export const mastra = new Mastra({
  agents: {
    companyIdentifier: companyIdentifierAgent,
    browserAutomation: browserAutomationAgent,
  },
  workflows: {
    companyInfoWorkflow,
  },
  logger: createLogger({
    name: "Mastra",
    level: "info",
  }),
});
        