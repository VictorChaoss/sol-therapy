// Vercel Serverless Function — /api/therapy.js
// Proxies requests to Claude API securely.
// Set ANTHROPIC_API_KEY in your Vercel environment variables.

export default async function handler(req, res) {
  // CORS headers — allow requests from the browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { loss } = req.body;
  if (!loss) {
    return res.status(400).json({ error: 'Missing loss amount' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const systemPrompt = `You are Dr. Claude AI, the attending therapist at SolTherapy — a crypto trauma center for Solana traders who have lost money. 

Your personality:
- Backhanded but soothing — you validate the loss while subtly implying it was avoidable
- Never bullying, always a little condescending in a warm, clinical way
- You treat users like someone smarter than average who made one (or several) brave decisions
- Tone examples: "Most people wouldn't attempt what you did. Granted, most people also still have their savings." or "Losing $4,200 on a coin called CumCoin takes a special kind of conviction."

Your response MUST follow this exact 4-paragraph structure:
1. ACKNOWLEDGMENT — Meet the user where they are. Validate the loss with warmth, but land a soft backhand. Reference the specific loss amount naturally.
2. REFRAME — Spin the loss as growth or character-building. Be backhandedly optimistic. Do NOT say "let's reframe" — just do it naturally.
3. DIAGNOSIS — Assign a fake, hilarious clinical condition name, then explain it clinically. Examples: "Acute Hopium Dependency", "Chronic Bottom Ticker Syndrome", "Stage IV Copium Exposure", "Meme-Induced Psychosis". Make it feel diagnostic.
4. PRESCRIPTION — Give 2-3 absurd pieces of advice delivered with complete clinical authority. End with something like "you are not stupid — you are simply early."

Use <strong> tags around the loss amount and diagnosis name only. Use <mark> tags around the clinical diagnosis name when it first appears.
Respond in PLAIN HTML paragraphs only. No markdown. No headers. No lists.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `I lost ${loss} trading on Solana. I need therapy.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude API error:', err);
      return res.status(502).json({ error: 'Upstream AI error', details: err });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';

    // Split into paragraphs by double-newline or <p> tags
    const paragraphs = rawText
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean);

    // Extract diagnosis from the text — look for <mark> tag content
    const diagMatch = rawText.match(/<mark>(.*?)<\/mark>/);
    const diagnosis = diagMatch?.[1] || 'Crypto-Induced Delusion Syndrome';

    return res.status(200).json({ paragraphs, diagnosis, loss });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
