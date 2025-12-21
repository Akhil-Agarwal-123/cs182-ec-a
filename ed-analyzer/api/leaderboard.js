import { kv } from '@vercel/kv';

function withCors(res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
  return res;
}

export default async function handler(req, res) {
  withCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  // Overall leaderboard only (no HW breakdown).
  // Stored as a Redis hash: field "<model>:w|l|t" => integer string.
  const raw = (await kv.hgetall('hw_arena:leaderboard')) || {};

  const models = {};
  for (const [field, val] of Object.entries(raw)) {
    const [model, metric] = field.split(':');
    if (!model || !metric) continue;
    if (!models[model]) models[model] = { w: 0, l: 0, t: 0 };
    const n = Number(val || 0);
    if (metric === 'w') models[model].w = n;
    if (metric === 'l') models[model].l = n;
    if (metric === 't') models[model].t = n;
  }

  return res.status(200).json({ ok: true, models, updatedAt: Date.now() });
}


