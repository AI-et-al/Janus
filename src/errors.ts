export class BudgetBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BudgetBlockedError';
  }
}
