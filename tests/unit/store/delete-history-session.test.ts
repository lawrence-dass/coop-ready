/**
 * Tests for History Deletion in Zustand Store
 *
 * Story 10.3: Implement History Deletion
 *
 * **Test Coverage:**
 * - Remove session from historyItems array
 * - Handle deletion of non-existent session
 * - Preserve other sessions when deleting one
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useOptimizationStore } from '@/store/useOptimizationStore';
import type { HistorySession } from '@/types/history';

describe('History Deletion in Store', () => {
  const mockSession1: HistorySession = {
    id: 'session-1',
    createdAt: new Date('2026-01-20'),
    resumeName: 'John Doe Resume',
    jobTitle: 'Software Engineer',
    companyName: 'TechCorp',
    jdPreview: 'Looking for a software engineer...',
    atsScore: 85,
    suggestionCount: 3,
  };

  const mockSession2: HistorySession = {
    id: 'session-2',
    createdAt: new Date('2026-01-21'),
    resumeName: 'Jane Smith Resume',
    jobTitle: 'Product Manager',
    companyName: 'StartupInc',
    jdPreview: 'Seeking product manager...',
    atsScore: 75,
    suggestionCount: 2,
  };

  const mockSession3: HistorySession = {
    id: 'session-3',
    createdAt: new Date('2026-01-22'),
    resumeName: 'Bob Johnson Resume',
    jobTitle: 'Designer',
    companyName: 'DesignCo',
    jdPreview: 'Need UX designer...',
    atsScore: 90,
    suggestionCount: 4,
  };

  beforeEach(() => {
    // Reset store state before each test
    useOptimizationStore.getState().reset();
  });

  describe('removeHistoryItem', () => {
    it('should remove a session from historyItems array', () => {
      // Setup: Add three sessions
      useOptimizationStore.getState().setHistoryItems([mockSession1, mockSession2, mockSession3]);
      const historyAfterSetup = useOptimizationStore.getState().historyItems;
      expect(historyAfterSetup).toHaveLength(3);

      // Act: Remove middle session
      useOptimizationStore.getState().removeHistoryItem('session-2');

      // Assert: Session 2 removed, others remain
      const updated = useOptimizationStore.getState().historyItems;
      expect(updated).toHaveLength(2);
      expect(updated.map((s) => s.id)).toEqual(['session-1', 'session-3']);
    });

    it('should handle deletion of first session', () => {
      // Setup
      useOptimizationStore.getState().setHistoryItems([mockSession1, mockSession2, mockSession3]);

      // Act: Remove first session
      useOptimizationStore.getState().removeHistoryItem('session-1');

      // Assert
      const updated = useOptimizationStore.getState().historyItems;
      expect(updated).toHaveLength(2);
      expect(updated.map((s) => s.id)).toEqual(['session-2', 'session-3']);
    });

    it('should handle deletion of last session', () => {
      // Setup
      useOptimizationStore.getState().setHistoryItems([mockSession1, mockSession2, mockSession3]);

      // Act: Remove last session
      useOptimizationStore.getState().removeHistoryItem('session-3');

      // Assert
      const updated = useOptimizationStore.getState().historyItems;
      expect(updated).toHaveLength(2);
      expect(updated.map((s) => s.id)).toEqual(['session-1', 'session-2']);
    });

    it('should handle deletion of non-existent session gracefully', () => {
      // Setup
      useOptimizationStore.getState().setHistoryItems([mockSession1, mockSession2]);

      // Act: Try to remove non-existent session
      useOptimizationStore.getState().removeHistoryItem('non-existent-id');

      // Assert: Original sessions remain unchanged
      const updated = useOptimizationStore.getState().historyItems;
      expect(updated).toHaveLength(2);
      expect(updated.map((s) => s.id)).toEqual(['session-1', 'session-2']);
    });

    it('should handle deletion when historyItems is empty', () => {
      // Setup: Empty history
      useOptimizationStore.getState().setHistoryItems([]);

      // Act: Try to remove session
      useOptimizationStore.getState().removeHistoryItem('session-1');

      // Assert: Still empty
      const updated = useOptimizationStore.getState().historyItems;
      expect(updated).toHaveLength(0);
    });

    it('should remove only the specified session and preserve order', () => {
      // Setup: Multiple sessions
      useOptimizationStore.getState().setHistoryItems([mockSession1, mockSession2, mockSession3]);

      // Act: Remove middle one
      useOptimizationStore.getState().removeHistoryItem('session-2');

      // Assert: Order preserved for remaining
      const updated = useOptimizationStore.getState().historyItems;
      expect(updated[0].id).toBe('session-1');
      expect(updated[0].resumeName).toBe('John Doe Resume');
      expect(updated[1].id).toBe('session-3');
      expect(updated[1].resumeName).toBe('Bob Johnson Resume');
    });

    it('should result in empty array when last session is removed', () => {
      // Setup: Single session
      useOptimizationStore.getState().setHistoryItems([mockSession1]);
      const historyAfterSetup = useOptimizationStore.getState().historyItems;
      expect(historyAfterSetup).toHaveLength(1);

      // Act: Remove it
      useOptimizationStore.getState().removeHistoryItem('session-1');

      // Assert: Empty array
      const updated = useOptimizationStore.getState().historyItems;
      expect(updated).toHaveLength(0);
      expect(updated).toEqual([]);
    });
  });
});
