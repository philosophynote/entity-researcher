import { createLogger } from "@mastra/core/logger";
import { Mastra } from '@mastra/core';
import { companyIdentifierAgent } from './agents/companyIdentifierAgent';
import { companyDataAgent } from './agents/companyDataAgent';
import { prtimesAgent } from './agents/prtimesAgent';
import { prtimesApiAgent } from './agents/prtimesApiAgent';
import { nikkeiAgent } from './agents/nikkeiAgent';
import { socialInsuranceAgent } from './agents/socialInsuranceAgent';
import { fetchNewsAgent } from './agents/fetchNewsAgent';
import { classifyRiskAgent } from './agents/classifyRiskAgent';
import { bulletinAgent } from './agents/bulletinAgent';
import { browserAgent } from './agents/browserAgent';
import { companyInfoWorkflow } from './workflows/companyInfoWorkflow';
import { classifyIndustryAgent } from './agents/classifyIndustryAgent';
import { prFlow, newsFlow, prAndNewsParallelWorkflow } from './workflows/prAndNewsParallelWorkflow';
import { companyDataWorkflow } from './workflows/companyDataWorkflow';
import { fullCompanyWorkflow } from './workflows/fullCompanyWorkflow';


export const mastra = new Mastra({
  agents: {
    companyIdentifier: companyIdentifierAgent,
    companyData: companyDataAgent,
    prtimesAgent: prtimesAgent,
    prtimesApiAgent: prtimesApiAgent,
    nikkeiAgent: nikkeiAgent,
    socialInsuranceAgent: socialInsuranceAgent,
    browserAgent: browserAgent,
    fetchNewsAgent: fetchNewsAgent,
    classifyRiskAgent: classifyRiskAgent,
    bulletinAgent: bulletinAgent,
    classifyIndustryAgent: classifyIndustryAgent,
  },
  vnext_workflows: {
    companyInfoWorkflow,
    prAndNewsParallelWorkflow,
    prFlow,
    newsFlow,
    companyDataWorkflow,
    fullCompanyWorkflow,
  },
  logger: createLogger({
    name: "Mastra",
    level: "debug",
  }),
});
        