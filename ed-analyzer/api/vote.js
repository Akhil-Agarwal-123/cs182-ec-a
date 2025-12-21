import { kv } from '@vercel/kv';

function withCors(res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
  return res;
}

const canonicalPairKey = (a, b) => [a, b].slice().sort((x, y) => x.localeCompare(y)).join('::');

export default async function handler(req, res) {
  withCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  let body = null;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
  }

  const hw = body?.hw; // accepted but not used for aggregation (overall leaderboard)
  const modelA = body?.modelA;
  const modelB = body?.modelB;
  const winner = body?.winner; // 'A' | 'B' | 'T'
  const clientId = body?.clientId;

  if (typeof modelA !== 'string' || !modelA.trim()) return res.status(400).json({ ok: false, error: 'Invalid modelA' });
  if (typeof modelB !== 'string' || !modelB.trim()) return res.status(400).json({ ok: false, error: 'Invalid modelB' });
  if (modelA === modelB) return res.status(400).json({ ok: false, error: 'modelA and modelB must differ' });
  if (winner !== 'A' && winner !== 'B' && winner !== 'T') return res.status(400).json({ ok: false, error: 'Invalid winner' });
  if (typeof clientId !== 'string' || !clientId.startsWith('c_')) return res.status(400).json({ ok: false, error: 'Invalid clientId' });

  // Light anti-abuse: one vote per (hw, pair, clientId) for 1 year.
  // (Even though aggregation is overall, we keep hw in the dedup key so users can vote per-HW matchup.)
  const voteKey = `hw_arena:vote:${String(hw ?? 'unknown')}:${canonicalPairKey(modelA, modelB)}:${clientId}`;
  const existing = await kv.get(voteKey);
  if (existing) return res.status(200).json({ ok: true, duplicate: true });
  await kv.set(voteKey, '1', { ex: 60 * 60 * 24 * 365 });

  const ops = [];
  const inc = (model, metric, delta) => ops.push(kv.hincrby('hw_arena:leaderboard', `${model}:${metric}`, delta));

  if (winner === 'A') {
    inc(modelA, 'w', 1);
    inc(modelB, 'l', 1);
  } else if (winner === 'B') {
    inc(modelB, 'w', 1);
    inc(modelA, 'l', 1);
  } else {
    inc(modelA, 't', 1);
    inc(modelB, 't', 1);
  }

  await Promise.all(ops);
  return res.status(200).json({ ok: true });
}


