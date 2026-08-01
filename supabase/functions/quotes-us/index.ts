const YAHOO = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_SEARCH = 'https://query1.finance.yahoo.com/v1/finance/search';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Quote = {
  ticker: string;
  price: number;
  previousClose: number;
  updatedAt: string;
};

type AssetHit = {
  ticker: string;
  name: string;
  assetClass: 'stock-br' | 'fii' | 'stock-us';
  sector: string;
  currency: 'BRL' | 'USD';
};

type DividendRequest = { ticker: string; symbol: string };
type DividendEvent = { ticker: string; exDate: string; amount: number };

async function fetchOne(symbol: string): Promise<Quote | null> {
  const response = await fetch(
    `${YAHOO}/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  );
  if (!response.ok) return null;

  const data = await response.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (typeof meta?.regularMarketPrice !== 'number') return null;

  return {
    ticker: symbol,
    price: meta.regularMarketPrice,
    previousClose:
      typeof meta.chartPreviousClose === 'number'
        ? meta.chartPreviousClose
        : meta.regularMarketPrice,
    updatedAt: new Date().toISOString(),
  };
}

function sectorOf(quote: Record<string, unknown>): string {
  return (quote.sectorDisp as string) ?? (quote.sector as string) ?? 'Outros';
}

function brAssetClass(ticker: string): 'fii' | 'stock-br' {
  return /11$/.test(ticker) ? 'fii' : 'stock-br';
}

type SectorRequest = {
  ticker: string;
  symbol: string;
  assetClass: string;
};

async function fetchSector(symbol: string): Promise<string | null> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=assetProfile`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  );
  if (!response.ok) return null;

  const data = await response.json();
  const profile = data?.quoteSummary?.result?.[0]?.assetProfile;
  const sector =
    (profile?.sector as string | undefined) ??
    (profile?.industry as string | undefined);
  return typeof sector === 'string' && sector !== '' ? sector : null;
}

async function enrichSectors(
  requests: SectorRequest[],
): Promise<Array<{ ticker: string; sector: string }>> {
  return Promise.all(
    requests.map(async (request) => {
      if (request.assetClass === 'crypto') {
        return { ticker: request.ticker, sector: 'Criptomoedas' };
      }

      const sector = await fetchSector(request.symbol);
      if (sector) return { ticker: request.ticker, sector };

      const market =
        request.symbol.endsWith('.SA') || request.assetClass === 'fii'
          ? 'BR'
          : 'US';
      const hits = await searchYahoo(request.ticker, market);
      const hit = hits.find(
        (entry) => entry.ticker.toUpperCase() === request.ticker.toUpperCase(),
      );

      return { ticker: request.ticker, sector: hit?.sector ?? 'Outros' };
    }),
  );
}

async function searchYahoo(
  term: string,
  market: 'BR' | 'US',
): Promise<AssetHit[]> {
  const response = await fetch(
    `${YAHOO_SEARCH}?q=${encodeURIComponent(term)}&quotesCount=12`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  );
  if (!response.ok) return [];

  const data = await response.json();
  const quotes: Array<Record<string, unknown>> = Array.isArray(data?.quotes)
    ? data.quotes
    : [];

  if (market === 'BR') {
    return quotes
      .filter((quote) => {
        const type = quote.quoteType;
        const symbol = typeof quote.symbol === 'string' ? quote.symbol : '';
        return (type === 'EQUITY' || type === 'ETF') && symbol.endsWith('.SA');
      })
      .slice(0, 8)
      .map((quote) => {
        const symbol = quote.symbol as string;
        const ticker = symbol.replace(/\.SA$/i, '');
        return {
          ticker,
          name:
            (quote.longname as string) ?? (quote.shortname as string) ?? ticker,
          assetClass: brAssetClass(ticker),
          sector: sectorOf(quote),
          currency: 'BRL',
        };
      });
  }

  return quotes
    .filter((quote) => {
      const type = quote.quoteType;
      const symbol = typeof quote.symbol === 'string' ? quote.symbol : '';
      return (
        (type === 'EQUITY' || type === 'ETF') &&
        symbol !== '' &&
        !symbol.includes('.')
      );
    })
    .slice(0, 8)
    .map((quote) => ({
      ticker: quote.symbol as string,
      name:
        (quote.longname as string) ??
        (quote.shortname as string) ??
        (quote.symbol as string),
      assetClass: 'stock-us',
      sector: sectorOf(quote),
      currency: 'USD',
    }));
}

async function fetchDividends(
  ticker: string,
  symbol: string,
  range: string,
): Promise<DividendEvent[]> {
  const response = await fetch(
    `${YAHOO}/${encodeURIComponent(symbol)}?interval=1d&range=${range}&events=div`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  );
  if (!response.ok) return [];

  const data = await response.json();
  const dividends = data?.chart?.result?.[0]?.events?.dividends ?? {};

  return (Object.values(dividends) as Array<Record<string, unknown>>)
    .filter(
      (entry) =>
        typeof entry.amount === 'number' && typeof entry.date === 'number',
    )
    .map((entry) => ({
      ticker,
      exDate: new Date((entry.date as number) * 1000)
        .toISOString()
        .slice(0, 10),
      amount: entry.amount as number,
    }));
}

const B3_FUNDS =
  'https://sistemaswebb3-listados.b3.com.br/fundsProxy/fundsCall/GetListedSupplementFunds';
const B3_COMPANIES =
  'https://sistemaswebb3-listados.b3.com.br/listedCompaniesProxy/CompanyCall';

type B3PaymentRequest = { ticker: string };
type SplitRequest = { ticker: string; symbol: string };
type SplitEvent = { ticker: string; date: string; ratio: number };
type DividendPayment = {
  ticker: string;
  dataCom: string;
  paymentDate: string;
  rate: number;
  label: string;
};

function fromBrDate(value: unknown): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value ?? ''));
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

function fromBrNumber(value: unknown): number {
  return Number(
    String(value ?? '')
      .replace(/\./g, '')
      .replace(',', '.'),
  );
}

function b3Params(payload: unknown): string {
  return btoa(JSON.stringify(payload));
}

async function b3Json(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!response.ok) return null;

  const body = await response.json();
  return typeof body === 'string' ? JSON.parse(body) : body;
}

// PETR3 é ON e PETR4 é PN; a B3 devolve as duas classes juntas, separadas
// apenas pelo ISIN, que marca a classe em OR/PR na posição 9.
function matchesShareClass(ticker: string, isin: string): boolean {
  const shareClass = isin.slice(9, 11);

  if (ticker.endsWith('3')) return shareClass === 'OR';
  if (ticker.endsWith('4')) return shareClass === 'PR';
  return true;
}

function toPayments(
  ticker: string,
  entries: Array<Record<string, unknown>>,
  isinFilter: boolean,
): DividendPayment[] {
  const seen = new Set<string>();
  const payments: DividendPayment[] = [];

  for (const entry of entries) {
    const paymentDate = fromBrDate(entry.paymentDate);
    const dataCom = fromBrDate(entry.lastDatePrior);
    const rate = fromBrNumber(entry.rate);
    if (!paymentDate || !dataCom || !Number.isFinite(rate) || rate <= 0) {
      continue;
    }

    const isin = String(entry.isinCode ?? '');
    if (isinFilter && !matchesShareClass(ticker, isin)) continue;

    const key = `${paymentDate}-${dataCom}-${rate}`;
    if (seen.has(key)) continue;
    seen.add(key);

    payments.push({
      ticker,
      dataCom,
      paymentDate,
      rate,
      label: String(entry.label ?? ''),
    });
  }

  return payments;
}

async function fetchFundPayments(ticker: string): Promise<DividendPayment[]> {
  const identifierFund = ticker.replace(/11B?$/, '');
  const data = await b3Json(
    `${B3_FUNDS}/${b3Params({ typeFund: 7, identifierFund })}`,
  );
  const entries = (data as { cashDividends?: unknown })?.cashDividends;

  return toPayments(ticker, Array.isArray(entries) ? entries : [], false);
}

async function fetchCompanyPayments(
  ticker: string,
): Promise<DividendPayment[]> {
  const found = await b3Json(
    `${B3_COMPANIES}/GetInitialCompanies/${b3Params({
      language: 'pt-br',
      pageNumber: 1,
      pageSize: 5,
      company: ticker,
    })}`,
  );

  const results = (found as { results?: unknown })?.results;
  const first = Array.isArray(results)
    ? (results[0] as Record<string, unknown> | undefined)
    : undefined;
  const issuingCompany = String(first?.issuingCompany ?? '');
  if (issuingCompany === '') return [];

  const data = await b3Json(
    `${B3_COMPANIES}/GetListedSupplementCompany/${b3Params({
      issuingCompany,
      language: 'pt-br',
    })}`,
  );

  const detail = Array.isArray(data)
    ? (data[0] as { cashDividends?: unknown } | undefined)
    : (data as { cashDividends?: unknown } | null);
  const entries = detail?.cashDividends;

  return toPayments(ticker, Array.isArray(entries) ? entries : [], true);
}

async function fetchB3Payments(ticker: string): Promise<DividendPayment[]> {
  const upper = ticker.toUpperCase();

  return /11B?$/.test(upper)
    ? fetchFundPayments(upper)
    : fetchCompanyPayments(upper);
}

async function fetchSplits(
  ticker: string,
  symbol: string,
): Promise<SplitEvent[]> {
  const response = await fetch(
    `${YAHOO}/${encodeURIComponent(symbol)}?interval=1d&range=20y&events=split`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  );
  if (!response.ok) return [];

  const data = await response.json();
  const splits = data?.chart?.result?.[0]?.events?.splits ?? {};

  return (Object.values(splits) as Array<Record<string, unknown>>)
    .filter(
      (entry) =>
        typeof entry.date === 'number' &&
        typeof entry.numerator === 'number' &&
        typeof entry.denominator === 'number' &&
        (entry.denominator as number) > 0,
    )
    .map((entry) => ({
      ticker,
      date: new Date((entry.date as number) * 1000).toISOString().slice(0, 10),
      ratio: (entry.numerator as number) / (entry.denominator as number),
    }));
}

async function fetchFxSeries(
  range: string,
): Promise<Array<{ date: string; rate: number }>> {
  const response = await fetch(`${YAHOO}/USDBRL=X?interval=1d&range=${range}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!response.ok) return [];

  const data = await response.json();
  const result = data?.chart?.result?.[0];
  const timestamps: unknown[] = result?.timestamp ?? [];
  const closes: unknown[] = result?.indicators?.quote?.[0]?.close ?? [];

  const series: Array<{ date: string; rate: number }> = [];
  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    const close = closes[i];
    if (typeof ts === 'number' && typeof close === 'number') {
      series.push({
        date: new Date(ts * 1000).toISOString().slice(0, 10),
        rate: close,
      });
    }
  }
  return series;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const body = await req.json();

    if (typeof body.search === 'string') {
      const market = body.market === 'BR' ? 'BR' : 'US';
      return Response.json(await searchYahoo(body.search, market), {
        headers: cors,
      });
    }

    if (Array.isArray(body.enrichSectors)) {
      return Response.json(await enrichSectors(body.enrichSectors), {
        headers: cors,
      });
    }

    if (Array.isArray(body.dividends)) {
      const range = typeof body.range === 'string' ? body.range : '5y';
      const results = await Promise.all(
        (body.dividends as DividendRequest[]).map((request) =>
          fetchDividends(
            String(request.ticker),
            String(request.symbol),
            range,
          ).catch(() => [] as DividendEvent[]),
        ),
      );
      return Response.json(results.flat(), { headers: cors });
    }

    if (Array.isArray(body.payments)) {
      const results = await Promise.all(
        (body.payments as B3PaymentRequest[]).map((request) =>
          fetchB3Payments(String(request.ticker)).catch(
            () => [] as DividendPayment[],
          ),
        ),
      );
      return Response.json(results.flat(), { headers: cors });
    }

    if (Array.isArray(body.splits)) {
      const results = await Promise.all(
        (body.splits as SplitRequest[]).map((request) =>
          fetchSplits(String(request.ticker), String(request.symbol)).catch(
            () => [] as SplitEvent[],
          ),
        ),
      );
      return Response.json(results.flat(), { headers: cors });
    }

    if (body.fx === 'USD-BRL') {
      const range = typeof body.range === 'string' ? body.range : '5y';
      return Response.json(await fetchFxSeries(range), { headers: cors });
    }

    const { symbols } = body;
    if (!Array.isArray(symbols)) {
      return Response.json(
        { error: 'symbols deve ser um array' },
        { status: 400, headers: cors },
      );
    }

    const results = await Promise.all(
      symbols.map((symbol: string) =>
        fetchOne(String(symbol).toUpperCase()).catch(() => null),
      ),
    );

    return Response.json(
      results.filter((quote): quote is Quote => quote !== null),
      { headers: cors },
    );
  } catch (error) {
    return Response.json(
      { error: String(error) },
      { status: 500, headers: cors },
    );
  }
});
