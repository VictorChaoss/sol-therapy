import { getTherapySession } from './api.js';

const app = document.getElementById('app');
let currentLoss = '';
let currentTherapy = null;

function renderHero() {
  app.innerHTML = `
    <header>
      <div class="logo">
        <div class="logo-dot"></div>
        SolTherapy
      </div>
    </header>

    <section class="hero">
      <div class="hero-badge">
        <div class="hero-badge-dot"></div>
        Accepting New Patients
      </div>

      <h1>
        <span class="line-1">Confess Your</span>
        <span class="line-2">Bags.</span>
      </h1>
      <p class="hero-sub">
        You didn't lose money. You just allocated capital into a very competitive
        experimental defi ecosystem at an inopportune moment.
      </p>

      <div class="input-card">
        <div class="input-label">Confession</div>
        <form id="form">
          <div class="input-wrap">
            <div class="input-prefix">$</div>
            <input
              id="loss"
              type="text"
              placeholder="Amount lost, or paste Solana wallet…"
              autocomplete="off"
            />
          </div>
          <div class="divider-row">or paste wallet to auto-detect PnL</div>
          <button class="btn-primary" type="submit">Start Session →</button>
        </form>
        <p class="input-hint">Free. Confidential. Mildly condescending.</p>
      </div>
    </section>

    <section class="testimonials">
      <div class="testimonials-label">Recent Patients</div>
      <div class="testimonial-grid">
        <div class="testimonial-card">
          <div class="t-handle">@degen.sol</div>
          <div class="t-text">"I've lost more to rug pulls than therapy normally costs. This felt fair."</div>
        </div>
        <div class="testimonial-card">
          <div class="t-handle">@wagmi_always</div>
          <div class="t-text">"Diagnosed with Chronic Bottom Ticker Syndrome. Accurate. Haunting."</div>
        </div>
        <div class="testimonial-card">
          <div class="t-handle">@flippening_guy</div>
          <div class="t-text">"Posted the certificate. 2,400 likes. Made back half my losses in attention."</div>
        </div>
      </div>
    </section>
  `;

  document.getElementById('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = document.getElementById('loss').value.trim();
    if (!raw) return;

    // Detect if it looks like a Solana address (base58, 32-44 chars) vs a dollar amount
    const isSolAddr = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(raw);
    if (isSolAddr) {
      currentLoss = 'fetching from wallet…';
    } else {
      const digits = raw.replace(/[^0-9.]/g, '');
      currentLoss = digits ? '$' + parseFloat(digits).toLocaleString() : raw;
    }

    renderLoading();
    getTherapySession(currentLoss).then(data => {
      currentTherapy = data;
      currentLoss = data.loss || currentLoss;
      setTimeout(renderSession, 400);
    });
  });
}

function renderLoading() {
  app.innerHTML = `
    <div class="loading-view">
      <div class="spinner-ring"></div>
      <div>
        <p class="loading-text">Reviewing your financial decisions…</p>
        <p class="loading-sub">Please allow a moment for judgment to fully form.</p>
      </div>
    </div>
  `;
}

function renderSession() {
  const { paragraphs } = currentTherapy;
  const paras = paragraphs.map(p => `<p class="session-para">${p}</p>`).join('');

  app.innerHTML = `
    <div class="session-view">
      <div class="session-header">
        <div class="session-avatar">🩺</div>
        <div>
          <div class="session-doctor">Dr. Claude AI</div>
          <div class="session-creds">Board Certified · Crypto Trauma Specialist</div>
        </div>
      </div>
      <div class="session-body">
        ${paras}
        <div class="session-actions">
          <button class="btn-cert" id="cert-btn">
            View Diagnosis Certificate ↓
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('cert-btn').addEventListener('click', renderCertificate);
}

function renderCertificate() {
  const { diagnosis } = currentTherapy;
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  app.innerHTML = `
    <div class="cert-view">
      <h2>Your Official Diagnosis</h2>

      <div id="cert-card">
        <div class="cert-top-bar"></div>
        <div class="cert-inner">
          <div class="cert-watermark">Ψ</div>

          <div class="cert-top-row">
            <div class="cert-issuer">
              Issued by
              <strong>SolTherapy Trauma Center</strong>
            </div>
            <div class="cert-seal">🩺</div>
          </div>

          <p class="cert-statement">This certifies that the bearer has been clinically diagnosed with</p>
          <div class="cert-name">${diagnosis}</div>

          <div class="cert-meta-row">
            <div class="cert-meta-item">
              <div class="cert-meta-label">Realized Loss</div>
              <div class="cert-meta-value loss">${currentLoss}</div>
            </div>
            <div class="cert-meta-item">
              <div class="cert-meta-label">Prognosis</div>
              <div class="cert-meta-value diag">Cautiously Hopeful</div>
            </div>
          </div>

          <div class="cert-footer-bar">
            <div class="cert-date-block">Date of Session<br/>${dateStr}</div>
            <div class="cert-sig-block">
              <div class="cert-sig">Dr. Claude AI</div>
              <div class="cert-sig-title">Attending Therapist, SolTherapy®</div>
            </div>
          </div>
        </div>
      </div>

      <div class="cert-btns">
        <button class="btn-icon" id="save-btn">
          ↓ &nbsp;Save as PNG
        </button>
        <button class="btn-icon twitter" id="tweet-btn">
          𝕏 &nbsp;Share on X
        </button>
        <button class="btn-new" id="new-btn">New Session</button>
      </div>
    </div>
  `;

  document.getElementById('save-btn').addEventListener('click', async () => {
    try {
      const canvas = await html2canvas(document.getElementById('cert-card'), {
        backgroundColor: '#09090f',
        scale: 2,
        useCORS: true,
      });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'soltherapy-certificate.png';
      a.click();
    } catch (err) {
      alert('Export failed. Try right-clicking and saving the card manually.');
    }
  });

  document.getElementById('tweet-btn').addEventListener('click', () => {
    const { diagnosis } = currentTherapy;
    const text = encodeURIComponent(
      `Just got clinically diagnosed with "${diagnosis}" after losing ${currentLoss} on Solana.\n\nFree therapy at soltherapy.io 🩺`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  });

  document.getElementById('new-btn').addEventListener('click', () => {
    currentLoss = '';
    currentTherapy = null;
    renderHero();
  });
}

renderHero();
