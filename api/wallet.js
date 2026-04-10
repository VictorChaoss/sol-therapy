// Vercel Serverless Function — /api/wallet.js
// Fetches wallet PnL from the GMGN public endpoint (proxied to avoid CORS).
// No API key required — uses the same endpoint the GMGN website uses internally.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { address } = req.query;
  if (!address) return res.status(400).json({ error: 'Missing wallet address' });

  // Validate it looks like a Solana address
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return res.status(400).json({ error: 'Invalid Solana address' });
  }

  try {
    // GMGN public wallet stats endpoint (used by their own frontend)
    const gmgnUrl = `https://gmgn.ai/defi/quotation/v1/smartmoney/sol/walletNew/${address}?period=7d`;

    const response = await fetch(gmgnUrl, {
      headers: {
        // Mimic a browser request to avoid blocks
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://gmgn.ai/',
        'Origin': 'https://gmgn.ai',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'GMGN returned an error', status: response.status });
    }

    const data = await response.json();

    // Extract the key PnL fields from GMGN's response structure
    const wallet = data?.data;
    if (!wallet) {
      return res.status(404).json({ error: 'No data found for this wallet' });
    }

    const realizedPnl = wallet.realized_profit ?? null;
    const unrealizedPnl = wallet.unrealized_profit ?? null;
    const winRate = wallet.win_rate ?? null;
    const totalTrades = wallet.buy_30d ?? wallet.total_buy ?? null;

    // Format PnL as a dollar string for use in the therapy session
    const formatUsd = (val) => {
      if (val === null || val === undefined) return null;
      const num = parseFloat(val);
      const abs = Math.abs(num);
      const prefix = num < 0 ? '-$' : '$';
      if (abs >= 1000000) return `${prefix}${(abs / 1000000).toFixed(2)}M`;
      if (abs >= 1000) return `${prefix}${(abs / 1000).toFixed(1)}K`;
      return `${prefix}${abs.toFixed(0)}`;
    };

    return res.status(200).json({
      address,
      realizedPnl,
      unrealizedPnl,
      winRate,
      totalTrades,
      // Pre-formatted for direct use by the therapy session
      lossString: formatUsd(realizedPnl),
      summary: buildSummary(realizedPnl, unrealizedPnl, winRate, totalTrades),
    });
  } catch (err) {
    console.error('Wallet handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function buildSummary(realized, unrealized, winRate, trades) {
  const parts = [];
  if (realized !== null) {
    const sign = realized >= 0 ? '+' : '';
    parts.push(`7d realized PnL: ${sign}$${parseFloat(realized).toFixed(0)}`);
  }
  if (unrealized !== null) {
    const sign = unrealized >= 0 ? '+' : '';
    parts.push(`unrealized: ${sign}$${parseFloat(unrealized).toFixed(0)}`);
  }
  if (winRate !== null) parts.push(`win rate: ${(parseFloat(winRate) * 100).toFixed(0)}%`);
  if (trades !== null) parts.push(`${trades} trades`);
  return parts.join(', ');
}
