/**
 * Janus Context Bridge
 *
 * Main API for persistent context management
 */

import * as read from './read.js';
import * as write from './write.js';
import * as sync from './sync.js';
import { Session, Decision, Task, CurrentFocus } from './types.js';

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

  // Git sync
  async sync(message: string): Promise<void> {
    return sync.syncContext(message);
  }

  async getHistory(): Promise<string[]> {
    return sync.loadContextHistory();
  }
}

export * from './types.js';
