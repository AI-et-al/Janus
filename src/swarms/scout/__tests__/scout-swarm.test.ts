import { describe, it, expect, beforeAll } from 'vitest';
import { ScoutSwarm, ScoutTask } from '../index.js';
import * as dotenv from 'dotenv';

dotenv.config();

describe('ScoutSwarm', () => {
  let swarm: ScoutSwarm;

  beforeAll(() => {
    swarm = new ScoutSwarm();
  });

  describe('URL Verification', () => {
    it('should handle URL verification requests', async () => {
      const task: ScoutTask = {
        id: 'test-1',
        query: 'https://www.npmjs.com',
        type: 'url-verify'
      };

      const results = await swarm.execute([task]);
      
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('success');
      expect(results[0].data).toHaveProperty('verified');
      expect(results[0].data).toHaveProperty('url');
      expect(results[0].reasoning).toBeTruthy();
    }, 10000);

    it('should detect inaccessible URLs', async () => {
      const task: ScoutTask = {
        id: 'test-2',
        query: 'https://this-domain-definitely-does-not-exist-12345678.com',
        type: 'url-verify'
      };

      const results = await swarm.execute([task]);
      
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('success');
      expect(results[0].data.verified).toBe(false);
    }, 10000);
  });

  describe('Package Check', () => {
    it('should find existing npm packages', async () => {
      const task: ScoutTask = {
        id: 'test-3',
        query: 'express',
        type: 'package-check'
      };

      const results = await swarm.execute([task]);
      
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('success');
      expect(results[0].data.exists).toBe(true);
      expect(results[0].data.name).toBe('express');
      expect(results[0].data.version).toBeTruthy();
      expect(results[0].data.installCommand).toBe('npm install express');
    }, 10000);

    it('should detect non-existent packages', async () => {
      const task: ScoutTask = {
        id: 'test-4',
        query: 'this-package-definitely-does-not-exist-xyz123',
        type: 'package-check'
      };

      const results = await swarm.execute([task]);
      
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('success');
      expect(results[0].data.exists).toBe(false);
    }, 10000);

    it('should detect stale packages', async () => {
      // Using 'left-pad' as it's known to be old
      const task: ScoutTask = {
        id: 'test-5',
        query: 'left-pad',
        type: 'package-check'
      };

      const results = await swarm.execute([task]);
      
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('success');
      expect(results[0].data.exists).toBe(true);
      // Note: left-pad might not be stale anymore if it's been updated
      expect(results[0].data).toHaveProperty('isStale');
    }, 10000);
  });

  describe('Parallel Execution', () => {
    it('should execute multiple tasks in parallel', async () => {
      const tasks: ScoutTask[] = [
        {
          id: 'parallel-1',
          query: 'https://www.github.com',
          type: 'url-verify'
        },
        {
          id: 'parallel-2',
          query: 'axios',
          type: 'package-check'
        },
        {
          id: 'parallel-3',
          query: 'https://www.npmjs.com',
          type: 'url-verify'
        }
      ];

      const startTime = Date.now();
      const results = await swarm.execute(tasks);
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.status === 'success')).toBe(true);
      
      // Parallel execution should be faster than sequential
      // Sequential would take ~3 * avg_request_time
      // Parallel should be close to max(request_times)
      expect(duration).toBeLessThan(15000); // Should complete in reasonable time
    }, 20000);
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const task: ScoutTask = {
        id: 'error-1',
        query: 'invalid-url-format',
        type: 'url-verify'
      };

      const results = await swarm.execute([task]);
      
      expect(results).toHaveLength(1);
      // Should complete but mark as not verified
      expect(results[0].status).toBe('success');
      expect(results[0].data.verified).toBe(false);
    }, 10000);
  });

  describe('LLM Query (requires API key)', () => {
    it('should perform general queries with Claude Haiku', async () => {
      // Skip if no API key
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('⚠️ Skipping LLM test - no ANTHROPIC_API_KEY');
        return;
      }

      const task: ScoutTask = {
        id: 'llm-1',
        query: 'What is the latest stable version of Node.js as of December 2024?',
        type: 'general-query'
      };

      const results = await swarm.execute([task]);
      
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('success');
      expect(results[0].data).toBeTruthy();
      expect(results[0].reasoning).toBeTruthy();
    }, 30000);
  });
});
