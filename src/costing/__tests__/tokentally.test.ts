import { describe, expect, it } from 'vitest';
import {
  estimateUsdCost,
  normalizeTokenUsage,
  pricingFromUsdPerMillion
} from '../tokentally.js';

describe('tokentally', () => {
  it('pricingFromUsdPerMillion validates inputs (both call shapes)', () => {
    expect(() => pricingFromUsdPerMillion(-1, 1)).toThrow();
    expect(() => pricingFromUsdPerMillion(1, -1)).toThrow();
    expect(() => pricingFromUsdPerMillion({ inputUsdPerMillion: -1, outputUsdPerMillion: 1 })).toThrow();

    expect(pricingFromUsdPerMillion(1, 2)).toEqual({
      inputUsdPerMillion: 1,
      outputUsdPerMillion: 2
    });

    expect(pricingFromUsdPerMillion({ inputUsdPerMillion: 1, outputUsdPerMillion: 2 })).toEqual({
      inputUsdPerMillion: 1,
      outputUsdPerMillion: 2
    });
  });

  it('normalizeTokenUsage handles common shapes', () => {
    expect(normalizeTokenUsage({ prompt_tokens: 10, completion_tokens: 5 })).toEqual({
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15
    });

    expect(normalizeTokenUsage({ input_tokens: 3, output_tokens: 7, total_tokens: 99 })).toEqual({
      inputTokens: 3,
      outputTokens: 7,
      totalTokens: 99
    });

    expect(normalizeTokenUsage(undefined)).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0
    });
  });

  it('estimateUsdCost uses per-million pricing', () => {
    const pricing = pricingFromUsdPerMillion(1.0, 2.0); // $1/M in, $2/M out
    const usage = { inputTokens: 1_000_000, outputTokens: 500_000, totalTokens: 1_500_000 };
    expect(estimateUsdCost({ usage, pricing })).toEqual({
      inputUsd: 1.0,
      outputUsd: 1.0,
      totalUsd: 2.0
    });
  });
});
