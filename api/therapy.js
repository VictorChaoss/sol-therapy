// Vercel Serverless Function — /api/therapy.js
// Uses OpenRouter to access Claude (or any model) securely.
// Set OPENROUTER_API_KEY in your Vercel environment variables.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { loss, walletInfo } = req.body;
  if (!loss) return res.status(400).json({ error: 'Missing loss amount' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const systemPrompt = `You are Dr. Claude AI, the attending therapist at SolTherapy — a crypto trauma center for Solana traders who have lost money.

Your personality:
- Backhanded but soothing — validate the loss while subtly implying it was avoidable
- Never bullying, always a little condescending in a warm, clinical way
- Treat users like someone smarter than average who made one (or several) brave decisions
- Tone examples: "Most people wouldn't attempt what you did. Granted, most people also still have their savings."

Your response MUST follow this exact 4-paragraph structure:
1. ACKNOWLEDGMENT — Validate the loss warmly, land a soft backhand. Reference the loss amount naturally.
2. REFRAME — Spin the loss as growth. Be backhandedly optimistic. Don't say "let's reframe" — just do it.
3. DIAGNOSIS — Assign a hilarious fake clinical condition. Wrap the name in <mark> tags. Examples: "Acute Hopium Dependency", "Chronic Bottom Ticker Syndrome", "Stage IV Copium Exposure".
4. PRESCRIPTION — 2-3 absurd pieces of advice delivered clinically. End with some version of "you are not stupid — you are simply early."

Use <strong> tags around the loss amount and the diagnosis name only. Use <mark> tags around the diagnosis name on first mention.
Respond in plain HTML paragraphs only. No markdown. No headers. No bullet points.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://soltherapy.io',
        'X-Title': 'SolTherapy',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4-5',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `I lost ${loss} trading on Solana. I need therapy.${walletInfo ? `\n\nWallet stats: ${walletInfo}` : ''}` },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter error:', err);
      return res.status(502).json({ error: 'Upstream AI error', details: err });
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';

    const paragraphs = rawText
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean);

    const diagMatch = rawText.match(/<mark>(.*?)<\/mark>/);
    const diagnosis = diagMatch?.[1] || 'Crypto-Induced Delusion Syndrome';

    return res.status(200).json({ paragraphs, diagnosis, loss });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
