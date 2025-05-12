import { createLogger } from "@mastra/core/logger";
import { Mastra } from '@mastra/core';
import { companyIdentifierAgent } from './agents/companyIdentifierAgent';
import { browserAutomationAgent } from './agents/browserAutomationAgent';
import { companyDataAgent } from './agents/companyDataAgent';
import { companyInfoWorkflow } from './workflows/companyInfoWorkflow';
import { prtimesAgent } from './agents/prtimesAgent';
import { nikkeiAgent } from './agents/nikkeiAgent';
import { openworkAgent } from './agents/openworkAgent';

export const mastra = new Mastra({
  agents: {
    companyIdentifier: companyIdentifierAgent,
    browserAutomation: browserAutomationAgent,
    companyData: companyDataAgent,
    prtimesAgent: prtimesAgent,
    nikkeiAgent: nikkeiAgent,
    openworkAgent: openworkAgent,
  },
  workflows: {
    companyInfoWorkflow,
  },
  logger: createLogger({
    name: "Mastra",
    level: "debug",
  }),
});
        