/**
 * Janus Context Bridge
 *
 * Main API for persistent context management
 */

import * as read from './read.js';
import * as write from './write.js';
import * as sync from './sync.js';
import {
  Session,
  Decision,
  Task,
  CurrentFocus,
  BudgetConfig,
  ModelRouterConfig,
  ModelRatingEvent,
  ModelTierSnapshot,
  ModelCatalogAuditEvent,
  ModelCatalogStatus,
  LastModelRun
} from '../types.js';

export class ContextBridge {
  // Session management
  async createSession(summary: string): Promise<Session> {
    return write.createSession(summary);
  }

  async loadSession(id: string): Promise<Session> {
    return read.loadSession(id);
  }

  async saveSession(session: Session): Promise<void> {
    return write.saveSession(session);
  }

  async listSessions(): Promise<string[]> {
    return read.listSessions();
  }

  // Decision management
  async recordDecision(sessionId: string, decision: Decision): Promise<void> {
    return write.recordDecision(sessionId, decision);
  }

  async loadDecision(id: string): Promise<Decision> {
    return read.loadDecision(id);
  }

  async listDecisions(): Promise<string[]> {
    return read.listDecisions();
  }

  // Task management
  async delegateTask(task: Task): Promise<void> {
    return write.delegateTask(task);
  }

  async updateTaskStatus(
    taskId: string,
    status: Task['status'],
    result?: string
  ): Promise<void> {
    return write.updateTaskStatus(taskId, status, result);
  }

  async updateTask(taskId: string, patch: Partial<Task>): Promise<void> {
    return write.updateTask(taskId, patch);
  }

  async loadTask(id: string): Promise<Task> {
    return read.loadTask(id);
  }

  async listTasks(): Promise<Task[]> {
    return read.listTasks();
  }

  // Focus management
  async getCurrentFocus(): Promise<CurrentFocus> {
    return read.getCurrentFocus();
  }

  async updateFocus(focus: Partial<CurrentFocus>): Promise<void> {
    return write.updateFocus(focus);
  }

  async getBudgetConfig(): Promise<BudgetConfig | null> {
    return read.getBudgetConfig();
  }

  async updateBudgetConfig(monthlyBudget: number): Promise<BudgetConfig> {
    return write.updateBudgetConfig(monthlyBudget);
  }

  async clearBudgetConfig(): Promise<void> {
    return write.clearBudgetConfig();
  }

  async getModelRouterConfig(): Promise<ModelRouterConfig | null> {
    return read.getModelRouterConfig();
  }

  async saveModelRouterConfig(config: ModelRouterConfig): Promise<void> {
    return write.saveModelRouterConfig(config);
  }

  async getModelCatalogStatus(): Promise<ModelCatalogStatus | null> {
    return read.getModelCatalogStatus();
  }

  async saveModelCatalogStatus(status: ModelCatalogStatus): Promise<void> {
    return write.saveModelCatalogStatus(status);
  }

  async appendModelCatalogAudit(event: ModelCatalogAuditEvent): Promise<void> {
    return write.appendModelCatalogAudit(event);
  }

  async listModelRatings(limit?: number): Promise<ModelRatingEvent[]> {
    return read.listModelRatings(limit);
  }

  async appendModelRating(event: ModelRatingEvent): Promise<void> {
    return write.appendModelRating(event);
  }

  async getModelTierSnapshot(): Promise<ModelTierSnapshot | null> {
    return read.getModelTierSnapshot();
  }

  async saveModelTierSnapshot(snapshot: ModelTierSnapshot): Promise<void> {
    return write.saveModelTierSnapshot(snapshot);
  }

  async clearModelTierSnapshot(): Promise<void> {
    return write.clearModelTierSnapshot();
  }

  async clearModelRatings(): Promise<void> {
    return write.clearModelRatings();
  }

  async getLastModelRun(): Promise<LastModelRun | null> {
    return read.getLastModelRun();
  }

  async saveLastModelRun(run: LastModelRun): Promise<void> {
    return write.saveLastModelRun(run);
  }

  // Git sync
  async sync(message: string): Promise<void> {
    return sync.syncContext(message);
  }

  async getHistory(): Promise<string[]> {
    return sync.loadContextHistory();
  }
}

export type {
  Session,
  Decision,
  Task,
  CurrentFocus,
  TaskResult,
  ContextBridgeConfig,
  BudgetConfig,
  ModelRouterConfig,
  ModelRatingEvent,
  ModelTierSnapshot,
  ModelCatalogAuditEvent,
  ModelCatalogStatus,
  LastModelRun,
  PeerRating
} from '../types.js';
