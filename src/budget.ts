import { existsSync, readdirSync, readFileSync } from 'fs';
import * as path from 'path';
import type { BudgetConfig, SessionCosts } from './types.js';

const getContextPath = () => process.env.JANUS_CONTEXT_PATH || './janus-context';

export const getBudgetConfigPath = (): string =>
  path.join(getContextPath(), 'state', 'budget.json');

export function loadBudgetConfig(): BudgetConfig | null {
  const budgetPath = getBudgetConfigPath();
  if (!existsSync(budgetPath)) {
    return null;
  }

  try {
    const content = readFileSync(budgetPath, 'utf-8');
    const config = JSON.parse(content) as BudgetConfig;
    if (typeof config?.monthlyBudget === 'number' && Number.isFinite(config.monthlyBudget)) {
      return config;
    }
  } catch (error) {
    console.warn('Failed to read budget config:', error);
  }

  return null;
}

export function getMonthlyBudget(): number {
  const override = loadBudgetConfig();
  if (override) {
    return override.monthlyBudget;
  }

  return parseFloat(process.env.JANUS_BUDGET_MONTHLY || '150');
}

export function computeSpentThisMonthFromContext(): number {
  const contextPath = getContextPath();
  const costsDir = path.join(contextPath, 'costs');
  if (!existsSync(costsDir)) {
    return 0;
  }

  const monthKey = new Date().toISOString().slice(0, 7);
  let total = 0;

  try {
    const files = readdirSync(costsDir).filter(file => file.endsWith('.json'));
    for (const file of files) {
      try {
        const contents = readFileSync(path.join(costsDir, file), 'utf-8');
        const sessionCosts = JSON.parse(contents) as SessionCosts;
        if (!sessionCosts?.entries) {
          continue;
        }

        for (const entry of sessionCosts.entries) {
          if (entry?.timestamp?.slice(0, 7) === monthKey) {
            total += Number(entry.cost || 0);
          }
        }
      } catch (error) {
        console.warn(`Failed to read cost file ${file}:`, error);
      }
    }
  } catch (error) {
    console.warn('Failed to read cost directory:', error);
  }

  return total;
}

export function getBudgetStatus(): {
  monthlyBudget: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
} {
  const monthlyBudget = getMonthlyBudget();
  const spent = computeSpentThisMonthFromContext();
  const remaining = Math.max(0, monthlyBudget - spent);
  const percentageUsed = monthlyBudget > 0 ? Math.min(100, (spent / monthlyBudget) * 100) : 0;

  return {
    monthlyBudget,
    spent,
    remaining,
    percentageUsed
  };
}
