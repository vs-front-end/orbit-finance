// Importa as carteiras exportadas do Investing (z-folder) para a conta do
// usuário no Supabase. Uso:
//   SUPABASE_SERVICE_KEY=<service_role> node scripts/import-investing.mjs
// Rodar uma única vez (insere; não deduplica contra o que já existe).

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const SUPABASE_URL = "https://exjehutpmguusnbusqqf.supabase.co";
const USER_ID = "be3c025c-54d4-454a-af70-a80d8d2afde2";
const Z_FOLDER = "/Users/vsdev/Projects/z-folder";
const FALLBACK_DATE = "2026-01-15T13:00:00.000Z";

const serviceKey = process.env.SUPABASE_SERVICE_KEY;
if (!serviceKey) {
  console.error("Defina SUPABASE_SERVICE_KEY no ambiente.");
  process.exit(1);
}

// Mapeia cada arquivo (por prefixo) à carteira: nome, moeda e classe de ativo.
const PORTFOLIO_BY_PREFIX = [
  { prefix: "FII s", name: "FII's", currency: "BRL", assetClass: "fii" },
  { prefix: "BRL s", name: "BRL's", currency: "BRL", assetClass: "stock-br" },
  { prefix: "USD s - TECH", name: "USD's - TECH", currency: "USD", assetClass: "stock-us" },
  { prefix: "BTC s", name: "BTC's", currency: "USD", assetClass: "crypto" },
];

function matchPortfolio(filename) {
  // Testa o mais específico primeiro (USD s - TECH antes de qualquer "USD s").
  return [...PORTFOLIO_BY_PREFIX]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((entry) => filename.startsWith(entry.prefix));
}

function toFields(line) {
  return [...line.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
}

// Cada CSV tem 3 seções (título numa linha de 1 campo): "Resumo de posições
// abertas", "Posições abertas" (detalhada, com datas) e "Posições fechadas".
// Retorna as linhas da seção "Posições abertas".
function openPositionRows(content) {
  const lines = content.split(/\r?\n/);
  let section = null;
  const rows = [];

  for (const line of lines) {
    const fields = toFields(line);
    if (fields.length === 1) {
      section = fields[0];
      continue;
    }
    if (section === "Posições abertas" && fields.length > 1) rows.push(fields);
  }
  return rows;
}

function cleanTicker(raw) {
  return raw.split("/")[0].split(".")[0].trim().toUpperCase();
}

function parsePtBrNumber(raw) {
  return Number(raw.replace(/\./g, "").replace(",", "."));
}

// "28/05/2026" → ISO (meio-dia UTC para não escorregar de dia por fuso).
function parseDate(raw) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim());
  if (!match) return FALLBACK_DATE;
  const [, d, m, y] = match;
  return `${y}-${m}-${d}T13:00:00.000Z`;
}

const files = readdirSync(Z_FOLDER).filter((f) => f.endsWith(".csv"));

const portfolios = [];
const transactions = [];
const assetsByTicker = new Map();

for (const file of files) {
  const meta = matchPortfolio(file);
  if (!meta) {
    console.warn(`Arquivo sem carteira correspondente, pulando: ${file}`);
    continue;
  }

  const portfolioId = randomUUID();
  const createdDates = [];

  const rows = openPositionRows(readFileSync(join(Z_FOLDER, file), "utf8"));
  const header = rows.find((fields) => fields[1] === "Nome");
  if (!header) {
    console.warn(`Sem seção "Posições abertas" em ${file}, pulando`);
    continue;
  }

  const col = {
    name: header.indexOf("Nome"),
    ticker: header.indexOf("Códigos"),
    date: header.indexOf("Abertura"),
    side: header.indexOf("Tipo"),
    qty: header.indexOf("Qtd."),
    price: header.indexOf("Pço Abert."),
  };

  let count = 0;
  for (const fields of rows) {
    if (fields === header || fields[col.side] !== "Compra" && fields[col.side] !== "Venda")
      continue;

    const name = fields[col.name];
    const ticker = cleanTicker(fields[col.ticker]);
    const side = fields[col.side] === "Venda" ? "sell" : "buy";
    const quantity = Number(fields[col.qty]);
    const unitPrice = parsePtBrNumber(fields[col.price]);
    const executedAt = col.date >= 0 ? parseDate(fields[col.date]) : FALLBACK_DATE;

    if (!ticker || !Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
      console.warn(`Linha ignorada em ${file}: ${name} / ${fields[col.ticker]}`);
      continue;
    }

    transactions.push({
      id: randomUUID(),
      user_id: USER_ID,
      portfolioId,
      ticker,
      side,
      quantity,
      unitPrice,
      executedAt,
    });
    createdDates.push(executedAt);
    count += 1;

    if (!assetsByTicker.has(ticker)) {
      assetsByTicker.set(ticker, {
        id: randomUUID(),
        user_id: USER_ID,
        ticker,
        name,
        assetClass: meta.assetClass,
        sector: "Outros",
        currency: meta.currency,
      });
    }
  }

  portfolios.push({
    id: portfolioId,
    user_id: USER_ID,
    name: meta.name,
    kind: "investment",
    currency: meta.currency,
    createdAt: createdDates.sort()[0] ?? FALLBACK_DATE,
  });

  console.log(`${meta.name}: ${count} lançamentos`);
}

const assets = [...assetsByTicker.values()];

console.log(
  `\nTotal: ${portfolios.length} carteiras, ${transactions.length} transações, ${assets.length} ativos.`
);

if (process.env.DRY_RUN === "1") {
  console.log("\n[DRY RUN] Amostra de transações:");
  console.table(
    transactions.slice(0, 8).map(({ ticker, quantity, unitPrice, executedAt }) => ({
      ticker,
      quantity,
      unitPrice,
      data: executedAt.slice(0, 10),
    }))
  );
  process.exit(0);
}

const restHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

async function insert(table, rows, onConflict) {
  const url = onConflict
    ? `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`
    : `${SUPABASE_URL}/rest/v1/${table}`;
  const prefer = onConflict
    ? "return=minimal,resolution=merge-duplicates"
    : "return=minimal";

  const res = await fetch(url, {
    method: "POST",
    headers: { ...restHeaders, Prefer: prefer },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status} — ${await res.text()}`);
  console.log(`✓ ${table}: ${rows.length} inseridos`);
}

const existingRes = await fetch(
  `${SUPABASE_URL}/rest/v1/portfolios?user_id=eq.${USER_ID}&select=id`,
  { headers: restHeaders }
);
if (!existingRes.ok) throw new Error(`checagem: HTTP ${existingRes.status}`);
const existing = await existingRes.json();
if (existing.length > 0 && process.env.FORCE !== "1") {
  console.error(
    `Conta já tem ${existing.length} carteiras. Abortando para não duplicar (use FORCE=1 para ignorar).`
  );
  process.exit(1);
}

await insert("assets", assets, "user_id,ticker");
await insert("portfolios", portfolios);
await insert("transactions", transactions);

console.log("\nImport concluído.");
