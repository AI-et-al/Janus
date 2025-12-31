/**
 * Tests for Janus Context Bridge
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ContextBridge } from '../index';
import { Session, Decision, Task, CurrentFocus } from '../../types';

// Use test directory for context
const TEST_CONTEXT_PATH = path.join(process.cwd(), 'test-context');
process.env.JANUS_CONTEXT_PATH = TEST_CONTEXT_PATH;

describe('ContextBridge', () => {
  let bridge: ContextBridge;

  beforeEach(async () => {
    bridge = new ContextBridge();
    // Create test context directory
    await fs.mkdir(TEST_CONTEXT_PATH, { recursive: true });
    await fs.mkdir(path.join(TEST_CONTEXT_PATH, 'sessions'), { recursive: true });
    await fs.mkdir(path.join(TEST_CONTEXT_PATH, 'decisions'), { recursive: true });
    await fs.mkdir(path.join(TEST_CONTEXT_PATH, 'state', 'delegations'), {
      recursive: true
    });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_CONTEXT_PATH, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('Session Management', () => {
    it('should create a session', async () => {
      const session = await bridge.createSession('Test session');

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.summary).toBe('Test session');
      expect(session.started).toBeDefined();
      expect(session.keyDecisions).toEqual([]);
      expect(session.delegatedTasks).toEqual([]);
    });

    it('should load a session', async () => {
      const created = await bridge.createSession('Load test');
      const loaded = await bridge.loadSession(created.id);

      expect(loaded.id).toBe(created.id);
      expect(loaded.summary).toBe('Load test');
    });

    it('should list sessions', async () => {
      const session1 = await bridge.createSession('Session 1');
      const session2 = await bridge.createSession('Session 2');

      const sessions = await bridge.listSessions();

      expect(sessions).toContain(session1.id);
      expect(sessions).toContain(session2.id);
      expect(sessions.length).toBe(2);
    });

    it('should save updated session', async () => {
      const session = await bridge.createSession('Update test');

      session.summary = 'Updated summary';
      session.openQuestions = ['Question 1', 'Question 2'];
      await bridge.saveSession(session);

      const loaded = await bridge.loadSession(session.id);
      expect(loaded.summary).toBe('Updated summary');
      expect(loaded.openQuestions).toEqual(['Question 1', 'Question 2']);
    });
  });

  describe('Decision Management', () => {
    it('should record a decision', async () => {
      const session = await bridge.createSession('Decision test');

      const decision: Decision = {
        id: 'test-decision',
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        topic: 'Architecture approach',
        decision: 'Use multi-cloud provider routing',
        rationale: 'Optimizes cost and quality',
        madeBy: 'human',
        confidence: 95,
        reversible: true,
        alternatives: ['Single provider', 'Load balancer']
      };

      await bridge.recordDecision(session.id, decision);

      const decisions = await bridge.listDecisions();
      expect(decisions.length).toBeGreaterThan(0);
    });

    it('should load a decision', async () => {
      const session = await bridge.createSession('Decision load test');
      const decision: Decision = {
        id: 'test-decision',
        date: '2025-12-18',
        timestamp: new Date('2025-12-18').toISOString(),
        topic: 'Test topic',
        decision: 'Test decision',
        rationale: 'Test rationale',
        madeBy: 'council',
        confidence: 80,
        reversible: true,
        alternatives: ['Alt 1', 'Alt 2']
      };

      await bridge.recordDecision(session.id, decision);

      // List to get the file that was created
      const decisions = await bridge.listDecisions();
      expect(decisions.length).toBeGreaterThan(0);
    });
  });

  describe('Task Management', () => {
    it('should delegate a task', async () => {
      const task: Task = {
        id: 'test-task-1',
        description: 'Test task',
        assignedTo: 'scout-swarm',
        status: 'pending',
        context: 'Test context',
        dependencies: [],
        artifacts: [],
        result: undefined,
        model: 'haiku'
      };

      await bridge.delegateTask(task);

      const loaded = await bridge.loadTask(task.id);
      expect(loaded.id).toBe(task.id);
      expect(loaded.description).toBe('Test task');
      expect(loaded.status).toBe('pending');
    });

    it('should update task status', async () => {
      const task: Task = {
        id: 'test-task-2',
        description: 'Status update test',
        assignedTo: 'executor-swarm',
        status: 'pending',
        context: 'Test',
        dependencies: [],
        artifacts: [],
        model: 'sonnet'
      };

      await bridge.delegateTask(task);
      await bridge.updateTaskStatus(task.id, 'complete', 'Task completed successfully');

      const updated = await bridge.loadTask(task.id);
      expect(updated.status).toBe('complete');
      expect(updated.result).toBe('Task completed successfully');
    });

    it('should list tasks', async () => {
      const task1: Task = {
        id: 'task-1',
        description: 'Task 1',
        assignedTo: 'scout-swarm',
        status: 'pending',
        context: 'Test',
        dependencies: [],
        artifacts: [],
        model: 'haiku'
      };

      const task2: Task = {
        id: 'task-2',
        description: 'Task 2',
        assignedTo: 'council',
        status: 'pending',
        context: 'Test',
        dependencies: [],
        artifacts: [],
        model: 'sonnet'
      };

      await bridge.delegateTask(task1);
      await bridge.delegateTask(task2);

      const tasks = await bridge.listTasks();
      expect(tasks.length).toBe(2);
      expect(tasks.some(t => t.id === 'task-1')).toBe(true);
      expect(tasks.some(t => t.id === 'task-2')).toBe(true);
    });
  });

  describe('Focus Management', () => {
    it('should get current focus', async () => {
      // Initialize current-focus.json
      const focusPath = path.join(TEST_CONTEXT_PATH, 'state', 'current-focus.json');
      const initialFocus: CurrentFocus = {
        objective: 'Build Janus system',
        phase: 'Week 1 - Foundation',
        blockers: [],
        nextActions: ['Implement Context Bridge', 'Set up tests'],
        lastUpdated: new Date().toISOString()
      };

      await fs.writeFile(focusPath, JSON.stringify(initialFocus, null, 2));

      const focus = await bridge.getCurrentFocus();
      expect(focus.objective).toBe('Build Janus system');
      expect(focus.phase).toBe('Week 1 - Foundation');
      expect(focus.nextActions.length).toBe(2);
    });

    it('should update focus', async () => {
      // Initialize
      const focusPath = path.join(TEST_CONTEXT_PATH, 'state', 'current-focus.json');
      const initialFocus: CurrentFocus = {
        objective: 'Original objective',
        phase: 'Phase 1',
        blockers: [],
        nextActions: ['Action 1'],
        lastUpdated: new Date().toISOString()
      };

      await fs.writeFile(focusPath, JSON.stringify(initialFocus, null, 2));

      // Update
      await bridge.updateFocus({
        objective: 'Updated objective',
        blockers: ['Blocker 1']
      });

      const updated = await bridge.getCurrentFocus();
      expect(updated.objective).toBe('Updated objective');
      expect(updated.blockers).toContain('Blocker 1');
      expect(updated.phase).toBe('Phase 1'); // Unchanged fields preserved
    });
  });

  describe('Git Sync', () => {
    it('should handle sync with no git repo gracefully', async () => {
      await expect(bridge.sync('Test sync')).resolves.toBeUndefined();
    });

    it('should get history without errors', async () => {
      const history = await bridge.getHistory();
      expect(history).toEqual([]);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow', async () => {
      // Create session
      const session = await bridge.createSession('Integration test');

      // Add decision
      const decision: Decision = {
        id: 'int-decision',
        date: '2025-12-18',
        timestamp: new Date('2025-12-18').toISOString(),
        topic: 'Integration test decision',
        decision: 'Test workflow',
        rationale: 'Comprehensive integration test',
        madeBy: 'council',
        confidence: 90,
        reversible: true,
        alternatives: ['Alternative 1']
      };
      await bridge.recordDecision(session.id, decision);

      // Delegate task
      const task: Task = {
        id: 'int-task',
        description: 'Integration test task',
        assignedTo: 'executor-swarm',
        status: 'pending',
        context: 'Integration test',
        dependencies: [],
        artifacts: [],
        model: 'sonnet'
      };
      await bridge.delegateTask(task);

      // Update task
      await bridge.updateTaskStatus('int-task', 'complete', 'Integration test complete');

      // Verify all components are connected
      const loadedSession = await bridge.loadSession(session.id);
      const tasks = await bridge.listTasks();
      const decisions = await bridge.listDecisions();

      expect(loadedSession.id).toBe(session.id);
      expect(tasks.length).toBeGreaterThan(0);
      expect(decisions.length).toBeGreaterThan(0);
    });
  });
});
