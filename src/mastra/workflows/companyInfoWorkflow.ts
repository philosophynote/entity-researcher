import { Workflow, Step } from '@mastra/core/workflows';
import { z } from 'zod';
import { companyDataAgent } from '../agents/companyDataAgent';
import { browserAutomationAgent } from '../agents/browserAutomationAgent';
import { CompanyCandidate } from '../agents/companyIdentifierAgent';

const gatherBasicInfo = new Step({
  id: 'gatherBasicInfo',
  outputSchema: z.object({
    corporateUrl: z.string(),
    landingPages: z.array(z.string()),
    industry: z.string(),
    phone: z.string(),
    employees: z.number(),
    founded: z.string(),
    overview: z.string(),
  }),
  execute: async ({ context }) => {
    const { corporateNumber, name, address } = context.triggerData as CompanyCandidate;
    const prompt = `法人番号: ${corporateNumber}\n企業名: ${name}\n所在地: ${address}`;
    const res = await companyDataAgent.generate(prompt, {
      output: z.object({
        corporateUrl: z.string(),
        landingPages: z.array(z.string()),
        industry: z.string(),
        phone: z.string(),
        employees: z.number(),
        founded: z.string(),
        overview: z.string(),
      }),
    });
    return res.object;
  },
});

const gatherInsurance = new Step({
  id: 'gatherInsurance',
  outputSchema: z.object({
    insuredStatus: z.string(),
    insuredCount: z.number(),
  }),
  execute: async ({ context }) => {
    const { corporateNumber } = context.triggerData as CompanyCandidate;
    const prompt = `以下の手順で社会保険加入状況および被保険者人数を取得してください:\n1. browser_navigate https://www2.nenkin.go.jp/do/search_section/\n2. browser_snapshot\n3. 検索フォームに法人番号 ${corporateNumber} を入力し、browser_click\n4. 結果ページで browser_snapshot を実行`;
    const res = await browserAutomationAgent.generate(prompt, {
      output: z.object({
        insuredStatus: z.string(),
        insuredCount: z.number(),
      }),
    });
    return res.object;
  },
});

const gatherPressReleases = new Step({
  id: 'gatherPressReleases',
  outputSchema: z.object({
    pressReleases: z.array(z.object({
      title: z.string(),
      date: z.string(),
      url: z.string(),
    })),
  }),
  execute: async ({ context }) => {
    const { name } = context.triggerData as CompanyCandidate;
    const prompt = `以下のサイトから過去6ヶ月間のプレスリリース情報を取得してください:\n1. browser_navigate https://prtimes.jp/\n2. browser_snapshot\n3. 検索窓に企業名 ${name} を入力し、browser_click\n4. 結果リストに対して browser_snapshot を実行`;
    const res = await browserAutomationAgent.generate(prompt, {
      output: z.object({
        pressReleases: z.array(z.object({ title: z.string(), date: z.string(), url: z.string() })),
      }),
    });
    return res.object;
  },
});

const gatherNews = new Step({
  id: 'gatherNews',
  outputSchema: z.object({
    news: z.array(z.object({
      title: z.string(),
      date: z.string(),
      url: z.string(),
    })),
  }),
  execute: async ({ context }) => {
    const { name } = context.triggerData as CompanyCandidate;
    const prompt = `以下のサイトから最新のニュースを取得してください:\n1. browser_navigate https://www.nikkei.com/\n2. browser_snapshot\n3. 検索窓に企業名 ${name} を入力し、browser_click\n4. 結果リストに対して browser_snapshot を実行`;
    const res = await browserAutomationAgent.generate(prompt, {
      output: z.object({
        news: z.array(z.object({ title: z.string(), date: z.string(), url: z.string() })),
      }),
    });
    return res.object;
  },
});

const gatherReviews = new Step({
  id: 'gatherReviews',
  outputSchema: z.object({
    reviews: z.array(z.object({
      site: z.string(),
      content: z.string(),
      url: z.string(),
    })),
  }),
  execute: async ({ context }) => {
    const { name } = context.triggerData as CompanyCandidate;
    const prompt = `
    以下の口コミサイト一覧に対して、各サイトのトップページにアクセスし、企業名 "${name}" で検索して口コミを取得してください。
    サイト:
    - openwork: https://www.openwork.jp/my_top
    - 転職会議: https://jobtalk.jp/
    - エンゲージ: https://en-hyouban.com/
    - キャリコネ: https://careerconnection.jp/
    - Yahoo! しごとカタログ: https://jobcatalog.yahoo.co.jp/
    手順:
    1. browser_navigate <サイトURL>
    2. browser_snapshot
    3. 検索窓に企業名 "${name}" を入力し、browser_click
    4. 結果一覧に対して browser_snapshot
    最終出力は以下のスキーマに従ったJSONとして返してください:
    {
      "reviews": [
        { "site": string, "content": string, "url": string }
      ]
    }
    `;
    const res = await browserAutomationAgent.generate(prompt, {
      output: z.object({
        reviews: z.array(z.object({ site: z.string(), content: z.string(), url: z.string() })),
      }),
    });
    return res.object;
  },
});

const gatherBulletin = new Step({
  id: 'gatherBulletin',
  outputSchema: z.object({
    bulletinPosts: z.array(z.object({
      content: z.string(),
      url: z.string(),
    })),
  }),
  execute: async ({ context }) => {
    const { name } = context.triggerData as CompanyCandidate;
    const prompt = `以下の掲示板から企業名 ${name} の関連情報を取得してください:\n- itest.5ch.net\nbrowser_navigate -> browser_snapshot -> 検索 -> browser_snapshot`;
    const res = await browserAutomationAgent.generate(prompt, {
      output: z.object({
        bulletinPosts: z.array(z.object({ content: z.string(), url: z.string() })),
      }),
    });
    return res.object;
  },
});

export const companyInfoWorkflow = new Workflow({
  name: 'company-info-collection',
  triggerSchema: z.object({
    corporateNumber: z.string(),
    name: z.string(),
    address: z.string(),
  }),
});

companyInfoWorkflow
  .step(gatherBasicInfo)
  .then(gatherInsurance)
  .then(gatherPressReleases)
  .then(gatherNews)
  .then(gatherReviews)
  .then(gatherBulletin)
  .commit(); 