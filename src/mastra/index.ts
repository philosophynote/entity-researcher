import { createLogger } from "@mastra/core/logger";
import { Mastra } from '@mastra/core';
import companyIdentifierAgent from './agents/companyIdentifierAgent';

export const mastra = new Mastra({
  agents: {
    companyIdentifier: companyIdentifierAgent,
  },
  logger: createLogger({
    name: "Mastra",
    level: "info",
  }),
});
        