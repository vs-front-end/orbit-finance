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

async function fetchIndexReturn(
  symbol: string,
  days: number,
): Promise<number | null> {
  const range =
    days <= 30 ? '1mo' : days <= 90 ? '3mo' : days <= 180 ? '6mo' : '1y';
  const response = await fetch(
    `${YAHOO}/${encodeURIComponent(symbol)}?interval=1d&range=${range}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  );
  if (!response.ok) return null;

  const data = await response.json();
  const closes: unknown[] =
    data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
  const valid = closes.filter(
    (value): value is number => typeof value === 'number',
  );
  if (valid.length < 2) return null;

  const first = valid[0];
  const last = valid[valid.length - 1];
  if (first <= 0) return null;

  return (last / first - 1) * 100;
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

    if (body.fx === 'USD-BRL') {
      const range = typeof body.range === 'string' ? body.range : '5y';
      return Response.json(await fetchFxSeries(range), { headers: cors });
    }

    if (body.indexDays !== undefined && body.indexDays !== null) {
      const days = Math.max(1, Math.round(Number(body.indexDays)));
      if (!Number.isFinite(days)) {
        return Response.json(
          { error: 'indexDays inválido' },
          { status: 400, headers: cors },
        );
      }
      const [ibov, sp500] = await Promise.all([
        fetchIndexReturn('^BVSP', days),
        fetchIndexReturn('^GSPC', days),
      ]);
      return Response.json({ ibov, sp500 }, { headers: cors });
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
