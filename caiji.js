// 使用 npm 安装以下依赖：
// npm install node-html-parser

import { parse } from 'node-html-parser';

const BANKS = {
  HANG_SENG: 'https://cms.hangseng.com/cms/emkt/pmo/grp06/p04/chi/index.html',
  STANDARD_CHARTERED: 'https://www.sc.com/hk/zh/deposits/onlinetd/',
  HSBC: 'https://www.hsbc.com.hk/zh-hk/accounts/offers/deposits/'
};

async function scrapeHangSeng(html) {
  const root = parse(html);
  const rows = root.querySelectorAll('table.rateTable tr');
  const rates = {};

  for (let row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 2) {
      const term = cells[0].textContent.trim();
      const rate = parseFloat(cells[1].textContent.trim().replace('%', ''));
      if (!isNaN(rate)) {
        rates[term] = rate;
      }
    }
  }

  return {
    currency: 'HKD',
    rates: rates
  };
}

async function scrapeStandardChartered(html) {
  const root = parse(html);
  const rates = {};
  const rows = root.querySelectorAll('.table-responsive table tbody tr');

  for (let row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 2) {
      const term = cells[0].textContent.trim();
      const rate = parseFloat(cells[1].textContent.trim().replace('%', ''));
      if (!isNaN(rate)) {
        rates[term] = rate;
      }
    }
  }

  return {
    currency: 'HKD',
    rates: rates
  };
}

async function scrapeHSBC(html) {
  const root = parse(html);
  const rates = {};
  const rows = root.querySelectorAll('.rates-table tbody tr');

  for (let row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 2) {
      const term = cells[0].textContent.trim();
      const rate = parseFloat(cells[1].textContent.trim().replace('%', ''));
      if (!isNaN(rate)) {
        rates[term] = rate;
      }
    }
  }

  return {
    currency: 'HKD',
    rates: rates
  };
}

async function fetchAndParse(url, scrapeFunction) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    return await scrapeFunction(html);
  } catch (error) {
    console.error(`Error fetching or parsing ${url}: ${error.message}`);
    return null;
  }
}

async function updateBankRates(env) {
  const rates = {
    lastUpdated: new Date().toISOString(),
    hangSeng: await fetchAndParse(BANKS.HANG_SENG, scrapeHangSeng),
    standardChartered: await fetchAndParse(BANKS.STANDARD_CHARTERED, scrapeStandardChartered),
    hsbc: await fetchAndParse(BANKS.HSBC, scrapeHSBC)
  };

  await env.BANK_RATES.put('current_rates', JSON.stringify(rates));
  console.log('Bank rates updated successfully');
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(updateBankRates(env));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === '/update') {
      // 手动触发更新
      await updateBankRates(env);
      return new Response('Bank rates updated successfully', { status: 200 });
    } else if (url.pathname === '/rates') {
      // 获取当前利率
      const rates = await env.BANK_RATES.get('current_rates');
      if (rates) {
        return new Response(rates, {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response('No rates available', { status: 404 });
      }
    } else {
      return new Response('Not found', { status: 404 });
    }
  }
};
