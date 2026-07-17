/**
 * Deterministic (seeded) shuffle for match-the-following RIGHT columns.
 *
 * A match question's correct pairing is the index alignment left[i] <-> right[i],
 * so rendering the right column in stored order silently reveals every answer.
 * Instead we display the right column in a SEEDED shuffled order.
 *
 * Seeding by question_id makes the order:
 *   - identical across the live preview, the downloaded PDF, and every render
 *     surface (so a paper looks the same each time it is generated), and
 *   - different from one question to the next.
 *
 * The stored `options` / `answer` are never mutated — only the display order.
 */

// xmur3 string hash -> 32-bit seed generator.
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

// mulberry32 PRNG -> function returning floats in [0, 1).
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic permutation of [0..n): `order[displayRow] = originalIndex`.
 *
 * Uses Sattolo's algorithm, which produces a single-cycle permutation — i.e. a
 * DERANGEMENT: for n > 1 no item stays in its original position, so no displayed
 * row is aligned with its correct match. That matters here: even one fixed point
 * would reveal that pair's answer.
 *
 * @param {number} n     number of right-column items
 * @param {*}      seed  stable per-question seed (question_id; falls back to content)
 * @returns {number[]}
 */
export function seededMatchOrder(n, seed) {
  const len = Math.max(0, Number(n) || 0);
  const order = Array.from({ length: len }, (_, i) => i);
  if (len < 2) return order;

  const rand = mulberry32(xmur3(String(seed ?? ""))());
  // Sattolo: j is drawn from [0, i) (strictly less than i) -> guaranteed no fixed points.
  for (let i = len - 1; i > 0; i--) {
    const j = Math.floor(rand() * i);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export default seededMatchOrder;
