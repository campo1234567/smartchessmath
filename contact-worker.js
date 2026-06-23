export default {
  async fetch(request, env) {
    const cors = buildCorsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const allowedPaths = ['/contact-api/message', '/api/contact', '/message'];
    if (request.method !== 'POST' || !allowedPaths.includes(url.pathname)) {
      return json({ ok: false, error: 'Not found' }, 404, cors);
    }

    try {
      const data = await request.json();
      const clean = normalizeContactData(data);
      const validation = validateContactData(clean);
      if (validation) return json({ ok: false, error: validation }, 400, cors);

      const requestId = 'SCM-' + Date.now().toString(36).toUpperCase();
      const receivedAt = new Date().toISOString();
      const payload = { requestId, receivedAt, ...clean };

      if (env.CONTACT_KV) {
        await env.CONTACT_KV.put(`contact:${receivedAt}:${requestId}`, JSON.stringify(payload), {
          expirationTtl: 60 * 60 * 24 * 365
        });
      }

      await sendEmailWithResend(env, payload);

      return json({ ok: true, requestId }, 200, cors);
    } catch (err) {
      return json({ ok: false, error: 'Message service is not available now.' }, 500, cors);
    }
  }
};

function buildCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGIN || 'https://smartchessmath.com').split(',').map(x => x.trim()).filter(Boolean);
  const allowOrigin = allowed.includes('*') || allowed.includes(origin) || origin.endsWith('.smartchessmath.com') || origin.includes('localhost')
    ? origin || allowed[0]
    : allowed[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers });
}

function normalizeContactData(data) {
  const pick = (...names) => names.map(n => data?.[n]).find(v => v !== undefined && v !== null) || '';
  return {
    requestType: cleanText(pick('requestType', 'type')) || 'General Inquiry',
    contact: cleanText(pick('contact', 'name', 'contactPerson')),
    organization: cleanText(pick('organization', 'school', 'schoolOrganization')),
    mobile: cleanText(pick('mobile', 'phone', 'whatsapp')),
    country: cleanText(pick('country')),
    email: cleanText(pick('email')).toLowerCase(),
    message: cleanText(pick('message'), 4000),
    source: cleanText(pick('source')) || 'SmartChessMath Website'
  };
}

function cleanText(value, max = 500) {
  return String(value || '').replace(/<[^>]*>/g, '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function validateContactData(data) {
  if (!data.contact) return 'Contact person is required.';
  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) return 'Valid email is required.';
  if (!data.message && data.requestType !== 'School Championship Request') return 'Message is required.';
  if ((data.message || '').length > 4000) return 'Message is too long.';
  return '';
}

async function sendEmailWithResend(env, data) {
  if (!env.RESEND_API_KEY || !env.TO_EMAIL || !env.FROM_EMAIL) {
    throw new Error('Email service is not configured.');
  }

  const subject = `SmartChessMath: ${data.requestType} — ${data.organization || data.contact}`;
  const text = buildPlainText(data);
  const html = buildHtml(data);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [env.TO_EMAIL],
      reply_to: data.email,
      subject,
      text,
      html
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error('Resend failed: ' + details);
  }
}

function buildPlainText(d) {
  return [
    `Request ID: ${d.requestId}`,
    `Received: ${d.receivedAt}`,
    `Type: ${d.requestType}`,
    `Contact: ${d.contact}`,
    `Organization / School: ${d.organization || '-'}`,
    `Country: ${d.country || '-'}`,
    `Mobile / WhatsApp: ${d.mobile || '-'}`,
    `Email: ${d.email}`,
    '',
    'Message:',
    d.message || '-'
  ].join('\n');
}

function buildHtml(d) {
  const rows = [
    ['Request ID', d.requestId],
    ['Received', d.receivedAt],
    ['Type', d.requestType],
    ['Contact', d.contact],
    ['Organization / School', d.organization || '-'],
    ['Country', d.country || '-'],
    ['Mobile / WhatsApp', d.mobile || '-'],
    ['Email', d.email]
  ].map(([k, v]) => `<tr><td style="padding:8px 12px;font-weight:700;color:#08285a;border-bottom:1px solid #e5eef0">${escapeHtml(k)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5eef0">${escapeHtml(v)}</td></tr>`).join('');

  return `
  <div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;border:1px solid #d9e9d6;border-radius:16px;overflow:hidden">
    <div style="background:#06451d;color:white;padding:18px 22px">
      <h2 style="margin:0">SmartChessMath Website Request</h2>
    </div>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
    <div style="padding:18px 22px">
      <h3 style="color:#08285a;margin:0 0 8px">Message</h3>
      <div style="white-space:pre-wrap;line-height:1.55;background:#f7fff3;border:1px solid #d9e9d6;border-radius:12px;padding:14px">${escapeHtml(d.message || '-')}</div>
    </div>
  </div>`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}
