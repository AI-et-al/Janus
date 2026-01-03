import type {
  ModelRouterConfig,
  ModelRatingEvent,
  ModelTierSnapshot,
  PeerRating,
  QualityTier
} from './types.js';

export interface PeerRatingPromptInput {
  previousModelKey: string;
  previousOperation: string;
  previousTaskId: string;
  previousSessionId: string;
  previousCostUsd?: number;
  previousLatencyMs?: number;
  previousResultExcerpt?: string;
}

export interface PeerRatingParseResult {
  rating: PeerRating;
  rationale?: string;
}

export interface RecomputeModelTierOptions {
  previous?: ModelTierSnapshot | null;
  minRatings?: number;
  recencyHalfLifeDays?: number;
  qualityMinRating?: number;
  balancedMinRating?: number;
}

const DEFAULT_OPTIONS: Required<Omit<RecomputeModelTierOptions, 'previous'>> = {
  minRatings: 3,
  recencyHalfLifeDays: 30,
  qualityMinRating: 4,
  balancedMinRating: 3
};

export function buildPeerRatingPrompt(input: PeerRatingPromptInput): string {
  const cost = input.previousCostUsd ?? 0;
  const latency = input.previousLatencyMs ?? 0;
  const excerpt = (input.previousResultExcerpt || '').slice(0, 1500);

  return [
    'You are rating the previous model run in the Janus system.',
    'Give a 1-5 score that reflects quality relative to cost and latency.',
    '5 = excellent quality for the cost/latency, 1 = poor value for cost/latency.',
    '',
    `Previous model key: ${input.previousModelKey}`,
    `Operation: ${input.previousOperation}`,
    `Task ID: ${input.previousTaskId}`,
    `Session ID: ${input.previousSessionId}`,
    `Cost (USD): ${cost}`,
    `Latency (ms): ${latency}`,
    '',
    'Output excerpt:',
    excerpt || '(no output recorded)',
    '',
    'Respond with JSON only: {"rating": 1-5, "rationale": "<short reason>"}'
  ].join('\n');
}

export function parsePeerRatingResponse(text: string): PeerRatingParseResult | null {
  if (!text) {
    return null;
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        rating?: number;
        rationale?: string;
        reason?: string;
      };
      const rating = Number(parsed.rating);
      if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
        return {
          rating: rating as PeerRating,
          rationale: parsed.rationale || parsed.reason
        };
      }
    } catch {
      // Fall back to regex
    }
  }

  const fallback = text.match(/\b([1-5])\b/);
  if (fallback) {
    return {
      rating: Number(fallback[1]) as PeerRating
    };
  }

  return null;
}

function tierRank(tier: QualityTier): number {
  switch (tier) {
    case 'fast':
      return 1;
    case 'balanced':
      return 2;
    case 'quality':
      return 3;
  }
}

function tierFromRank(rank: number): QualityTier {
  if (rank <= 1) return 'fast';
  if (rank === 2) return 'balanced';
  return 'quality';
}

function clampTierChange(previous: QualityTier, next: QualityTier): QualityTier {
  const delta = tierRank(next) - tierRank(previous);
  if (Math.abs(delta) <= 1) return next;
  return tierFromRank(tierRank(previous) + Math.sign(delta));
}

function median(values: number[]): number | null {
  const cleaned = values.filter(value => Number.isFinite(value)).sort((a, b) => a - b);
  if (cleaned.length === 0) return null;
  const mid = Math.floor(cleaned.length / 2);
  if (cleaned.length % 2 === 1) return cleaned[mid] ?? null;
  return ((cleaned[mid - 1] ?? 0) + (cleaned[mid] ?? 0)) / 2;
}

function expDecayWeight(ageMs: number, halfLifeDays: number): number {
  if (!Number.isFinite(ageMs) || ageMs < 0) return 1;
  const halfLifeMs = halfLifeDays * 24 * 60 * 60 * 1000;
  const lambda = Math.LN2 / halfLifeMs;
  return Math.exp(-lambda * ageMs);
}

export function recomputeModelTierSnapshot(
  catalog: ModelRouterConfig,
  ratings: ModelRatingEvent[],
  options: RecomputeModelTierOptions = {}
): ModelTierSnapshot {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const nowMs = Date.now();

  const costs = ratings
    .map(event => event.toCostUsd)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const latencies = ratings
    .map(event => event.toLatencyMs)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  const medianCost = median(costs) ?? 1;
  const medianLatency = median(latencies) ?? 1;

  const avgRatings: Record<string, number> = {};
  const scores: Record<string, number> = {};
  const ratingCounts: Record<string, number> = {};

  for (const model of catalog.models) {
    const events = ratings.filter(event => event.toModelKey === model.key);
    ratingCounts[model.key] = events.length;

    if (events.length === 0) {
      avgRatings[model.key] = 0;
      scores[model.key] = 0;
      continue;
    }

    let ratingNum = 0;
    let ratingDen = 0;
    let costNum = 0;
    let latencyNum = 0;

    for (const event of events) {
      const ts = Date.parse(event.timestamp);
      const ageMs = Number.isFinite(ts) ? nowMs - ts : 0;
      const weight = expDecayWeight(ageMs, mergedOptions.recencyHalfLifeDays);

      ratingNum += event.rating * weight;
      ratingDen += weight;

      const cost = typeof event.toCostUsd === 'number' ? event.toCostUsd : medianCost;
      const latency = typeof event.toLatencyMs === 'number' ? event.toLatencyMs : medianLatency;
      costNum += cost * weight;
      latencyNum += latency * weight;
    }

    const meanRating = ratingDen > 0 ? ratingNum / ratingDen : 0;
    const meanCost = ratingDen > 0 ? costNum / ratingDen : medianCost;
    const meanLatency = ratingDen > 0 ? latencyNum / ratingDen : medianLatency;

    avgRatings[model.key] = meanRating;

    const normCost = meanCost / medianCost;
    const normLatency = meanLatency / medianLatency;
    scores[model.key] = meanRating / (normCost + normLatency + 1e-6);
  }

  const baseTiers: Record<string, QualityTier> = {};
  for (const model of catalog.models) {
    baseTiers[model.key] = options.previous?.tiers?.[model.key] ?? model.quality;
  }

  const eligible = catalog.models
    .map(model => model.key)
    .filter(key => (ratingCounts[key] ?? 0) >= mergedOptions.minRatings);

  if (eligible.length < 3) {
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      algorithm: 'peer-rating-v1',
      tiers: baseTiers,
      scores,
      avgRatings,
      ratingCounts
    };
  }

  eligible.sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));

  const bucketSize = Math.max(1, Math.floor(eligible.length / 3));
  const qualityKeys = new Set(eligible.slice(0, bucketSize));
  const fastKeys = new Set(eligible.slice(-bucketSize));

  const tiers: Record<string, QualityTier> = { ...baseTiers };
  for (const key of eligible) {
    let next: QualityTier = 'balanced';
    if (qualityKeys.has(key)) {
      next = 'quality';
    } else if (fastKeys.has(key)) {
      next = 'fast';
    }

    if (next === 'quality' && avgRatings[key] < mergedOptions.qualityMinRating) {
      next = 'balanced';
    }
    if (next === 'balanced' && avgRatings[key] < mergedOptions.balancedMinRating) {
      next = 'fast';
    }

    const previousTier = options.previous?.tiers?.[key];
    tiers[key] = previousTier ? clampTierChange(previousTier, next) : next;
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    algorithm: 'peer-rating-v1',
    tiers,
    scores,
    avgRatings,
    ratingCounts
  };
}
