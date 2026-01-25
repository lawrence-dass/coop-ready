/**
 * Integration Tests: Job Description Clear Flow
 *
 * Tests for Story 4.3 - Complete clear workflow with store integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JobDescriptionInput } from '@/components/shared/JobDescriptionInput';
import { useOptimizationStore } from '@/store';
import { isJobDescriptionValid } from '@/lib/validations/jobDescription';

// Test wrapper component to simulate real usage
function TestWrapper() {
  const jobDescription = useOptimizationStore((state) => state.jobDescription);
  const setJobDescription = useOptimizationStore((state) => state.setJobDescription);
  const clearJobDescription = useOptimizationStore((state) => state.clearJobDescription);

  return (
    <div>
      <JobDescriptionInput
        value={jobDescription || ''}
        onChange={setJobDescription}
        onClear={clearJobDescription}
      />
      <div data-testid="validation-status">
        {isJobDescriptionValid(jobDescription) ? 'valid' : 'invalid'}
      </div>
      <div data-testid="store-value">
        {jobDescription || 'null'}
      </div>
    </div>
  );
}

describe('Job Description Clear Flow Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    useOptimizationStore.getState().reset();
  });

  // ============================================================================
  // PASTE → CLEAR → VERIFY EMPTY
  // ============================================================================

  it('should clear JD from store and component when clear button clicked', async () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');
    const testJD = 'Senior Software Engineer with 5+ years of experience in React';

    // Paste text
    fireEvent.change(textarea, { target: { value: testJD } });

    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe(testJD);
    });

    // Click clear
    const clearButton = screen.getByRole('button', { name: /clear job description/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBeNull();
    });

    expect(textarea).toHaveValue('');
    expect(screen.getByTestId('store-value')).toHaveTextContent('null');
  });

  // ============================================================================
  // PASTE → CLEAR → PASTE DIFFERENT → VERIFY NEW
  // ============================================================================

  it('should allow entering new JD after clearing', async () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // First paste
    const firstJD = 'First job description content';
    fireEvent.change(textarea, { target: { value: firstJD } });

    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe(firstJD);
    });

    // Clear
    fireEvent.click(screen.getByRole('button', { name: /clear job description/i }));

    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBeNull();
    });

    // Paste different content
    const secondJD = 'Second job description content';
    fireEvent.change(textarea, { target: { value: secondJD } });

    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe(secondJD);
    });

    expect(textarea).toHaveValue(secondJD);
    expect(screen.getByTestId('store-value')).toHaveTextContent(secondJD);
  });

  // ============================================================================
  // MULTIPLE CLEAR CYCLES
  // ============================================================================

  it('should handle multiple clear cycles in same session', async () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Cycle 1: Paste
    fireEvent.change(textarea, { target: { value: 'First content' } });
    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe('First content');
    });

    // Cycle 1: Clear
    fireEvent.click(screen.getByRole('button', { name: /clear job description/i }));
    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBeNull();
    });

    // Cycle 2: Paste
    fireEvent.change(textarea, { target: { value: 'Second content' } });
    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe('Second content');
    });

    // Cycle 2: Clear
    fireEvent.click(screen.getByRole('button', { name: /clear job description/i }));
    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBeNull();
    });

    // Cycle 3: Paste
    fireEvent.change(textarea, { target: { value: 'Third content' } });
    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe('Third content');
    });

    // Final state
    expect(textarea).toHaveValue('Third content');
  });

  // ============================================================================
  // CHARACTER COUNT RESET AFTER CLEAR
  // ============================================================================

  it('should reset character count to 0 after clear', async () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Paste content
    fireEvent.change(textarea, { target: { value: 'Some job description' } });

    await waitFor(() => {
      expect(screen.getByText(/20 characters/i)).toBeInTheDocument();
    });

    // Clear
    const clearButton = screen.getByRole('button', { name: /clear job description/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText(/0 characters \(required\)/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // VALIDATION STATE AFTER CLEAR
  // ============================================================================

  it('should change validation status to invalid after clearing valid JD', async () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');
    const validationStatus = screen.getByTestId('validation-status');

    // Paste valid content (50+ chars)
    const validJD = 'a'.repeat(50);
    fireEvent.change(textarea, { target: { value: validJD } });

    await waitFor(() => {
      expect(validationStatus).toHaveTextContent('valid');
    });

    // Clear
    const clearButton = screen.getByRole('button', { name: /clear job description/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(validationStatus).toHaveTextContent('invalid');
    });
  });

  // ============================================================================
  // CLEAR BUTTON VISIBILITY AFTER CLEAR
  // ============================================================================

  it('should hide clear button after clearing', async () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Paste content
    fireEvent.change(textarea, { target: { value: 'Content to clear' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear job description/i })).toBeInTheDocument();
    });

    // Clear
    const clearButton = screen.getByRole('button', { name: /clear job description/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /clear job description/i })).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // CLEAR WITH INVALID JD
  // ============================================================================

  it('should clear invalid JD (< 50 chars) and return to required state', async () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Paste invalid content (< 50 chars)
    fireEvent.change(textarea, { target: { value: 'Short text' } });

    await waitFor(() => {
      expect(screen.getByText(/minimum 50 required/i)).toBeInTheDocument();
    });

    // Clear
    const clearButton = screen.getByRole('button', { name: /clear job description/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText(/0 characters \(required\)/i)).toBeInTheDocument();
      expect(screen.queryByText(/minimum 50 required/i)).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // RAPID CLEAR CLICKS
  // ============================================================================

  it('should handle rapid clear button clicks without issues', async () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Paste content
    fireEvent.change(textarea, { target: { value: 'Content for rapid clearing' } });

    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe('Content for rapid clearing');
    });

    // Rapid clicks
    const clearButton = screen.getByRole('button', { name: /clear job description/i });
    fireEvent.click(clearButton);
    fireEvent.click(clearButton);
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBeNull();
    });

    expect(textarea).toHaveValue('');
  });
});
