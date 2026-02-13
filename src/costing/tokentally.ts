/**
 * Token tally / costing helpers.
 *
 * This module is intentionally small + deterministic:
 * - Normalizes provider token usage shapes into a common form
 * - Computes USD estimates using per-million-token pricing
 *
 * NOTE:
 * - We do not try to be perfectly accurate for “reasoning tokens” etc.
 * - We keep this side-effect free so it’s easy to unit test.
 */

export type Pricing = {
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
};

export type TokenUsageNormalized = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export function pricingFromUsdPerMillion(
  inputUsdPerMillion: number,
  outputUsdPerMillion: number
): Pricing;
export function pricingFromUsdPerMillion(params: {
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
}): Pricing;
export function pricingFromUsdPerMillion(
  a: number | { inputUsdPerMillion: number; outputUsdPerMillion: number },
  b?: number
): Pricing {
  const inputUsdPerMillion = typeof a === 'number' ? a : a.inputUsdPerMillion;
  const outputUsdPerMillion = typeof a === 'number' ? (b as number) : a.outputUsdPerMillion;

  if (!Number.isFinite(inputUsdPerMillion) || inputUsdPerMillion < 0) {
    throw new Error(`Invalid inputUsdPerMillion: ${inputUsdPerMillion}`);
  }
  if (!Number.isFinite(outputUsdPerMillion) || outputUsdPerMillion < 0) {
    throw new Error(`Invalid outputUsdPerMillion: ${outputUsdPerMillion}`);
  }

  return { inputUsdPerMillion, outputUsdPerMillion };
}

/**
 * Accepts a variety of provider usage shapes.
 * We keep this permissive because SDKs differ and evolve.
 */
export function normalizeTokenUsage(usage: unknown): TokenUsageNormalized {
  const u = (usage ?? {}) as any;

  const inputTokens = numberOrZero(
    u.input_tokens ?? u.prompt_tokens ?? u.promptTokens ?? u.inputTokens
  );
  const outputTokens = numberOrZero(
    u.output_tokens ?? u.completion_tokens ?? u.completionTokens ?? u.outputTokens
  );

  const totalTokensRaw = u.total_tokens ?? u.totalTokens;
  const totalTokens = Number.isFinite(totalTokensRaw)
    ? Math.max(0, Number(totalTokensRaw))
    : Math.max(0, inputTokens + outputTokens);

  return { inputTokens, outputTokens, totalTokens };
}

export function estimateUsdCost(params: {
  usage: TokenUsageNormalized;
  pricing: Pricing;
}): { inputUsd: number; outputUsd: number; totalUsd: number } {
  const { usage, pricing } = params;

  // Convert “per million tokens” to “per token”.
  const perTokenIn = pricing.inputUsdPerMillion / 1_000_000;
  const perTokenOut = pricing.outputUsdPerMillion / 1_000_000;

  const inputUsd = usage.inputTokens * perTokenIn;
  const outputUsd = usage.outputTokens * perTokenOut;
  const totalUsd = inputUsd + outputUsd;

  // Round to 1e-6 for stable snapshots/logs.
  const round = (n: number) => Math.round(n * 1e6) / 1e6;

  return {
    inputUsd: round(inputUsd),
    outputUsd: round(outputUsd),
    totalUsd: round(totalUsd)
  };
}

function numberOrZero(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}
