// api.js — Frontend therapy session caller
// In development (localhost), uses mock data so no API key is needed.
// In production (Vercel), calls the secure /api/therapy serverless function.

const IS_DEV = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// ─── Mock fallback for local dev ──────────────────────────────────────────────
const CONDITIONS = [
  "Acute Hopium Dependency",
  "Chronic Bottom Ticker Syndrome",
  "Stage IV Copium Exposure",
  "Meme-Induced Psychosis",
  "Delusional Wealth Projection",
  "Compulsive Dip Acquisition Disorder",
  "Irreversible FOMO Sequelae",
  "Rug-Induced Attachment Disorder",
];

async function mockSession(loss) {
  await new Promise(r => setTimeout(r, 2200));
  const diagnosis = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
  return {
    paragraphs: [
      `I see you've come to us having parted ways with <strong>${loss}</strong>. Most humans, when confronted with that kind of number, experience what we in the field call a "come to Jesus" moment. You, and I mean this in the most clinical sense possible, seem to have shown up at the therapy office instead. That is, genuinely, a step forward. Horizontal growth is still growth.`,
      `Let us reframe this experience together. You did not "lose" <strong>${loss}</strong>. You made a series of high-conviction, time-sensitive capital allocation decisions in an emerging, highly asymmetric market. The market simply had a different conviction. The market, frankly, was wrong, and will be forced to reckon with that humiliation at some point — probably the moment you finally sell the remainder of your position.`,
      `Based on this session, I am formally diagnosing you with <mark>${diagnosis}</mark>. This is characterized by a persistent, almost moving belief that the next trade will be the one, alongside a risk tolerance that would make a Vegas pit boss genuinely concerned for your wellbeing. The good news is it is entirely manageable. The bad news is the primary treatment involves not looking at charts — which you will not do.`,
      `My prescription: close DexScreener. Touch the nearest grass. Drink water from a container not shaped like a Pepe frog. And remember — you are not stupid. You are simply <strong>early</strong>. Probably.`
    ],
    diagnosis,
    loss
  };
}

// ─── Real API call (Vercel serverless) ───────────────────────────────────────
async function liveSession(loss) {
  const res = await fetch('/api/therapy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loss }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Session failed');
  }

  return res.json();
}

// ─── Exported function ────────────────────────────────────────────────────────
export async function getTherapySession(loss) {
  if (IS_DEV) {
    return mockSession(loss);
  }
  return liveSession(loss);
}
