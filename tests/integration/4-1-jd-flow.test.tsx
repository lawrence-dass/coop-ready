/**
 * Integration Tests: Job Description Input Flow
 *
 * Tests for Story 4.1 - Complete job description input workflow
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
    </div>
  );
}

describe('Job Description Input Flow Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    useOptimizationStore.getState().reset();
  });

  it('should update store when user pastes text', async () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');
    const testJD = 'Senior Software Engineer with 5+ years of experience in React and TypeScript';

    fireEvent.change(textarea, { target: { value: testJD } });

    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe(testJD);
    });
  });

  it('should show accurate character count for various text lengths', () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Short text
    fireEvent.change(textarea, { target: { value: 'Short' } });
    expect(screen.getByText('5 characters (minimum 50 required)')).toBeInTheDocument();

    // Exactly 50 characters
    const exactly50 = 'a'.repeat(50);
    fireEvent.change(textarea, { target: { value: exactly50 } });
    expect(screen.getByText('50 characters')).toBeInTheDocument();
    expect(screen.queryByText(/minimum 50 required/i)).not.toBeInTheDocument();

    // More than 50 characters
    const moreThan50 = 'a'.repeat(100);
    fireEvent.change(textarea, { target: { value: moreThan50 } });
    expect(screen.getByText('100 characters')).toBeInTheDocument();
  });

  it('should clear JD from store and component when clear button clicked', async () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');
    const testJD = 'Test job description content';

    // Enter text
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
  });

  it('should validate JD and enable/disable analysis based on validation', () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');
    const validationStatus = screen.getByTestId('validation-status');

    // Initial state - invalid
    expect(validationStatus).toHaveTextContent('invalid');

    // Short text - invalid
    fireEvent.change(textarea, { target: { value: 'Short text' } });
    expect(validationStatus).toHaveTextContent('invalid');

    // Valid text (50+ characters)
    const validText = 'a'.repeat(50);
    fireEvent.change(textarea, { target: { value: validText } });
    expect(validationStatus).toHaveTextContent('valid');

    // Clear - invalid again
    const clearButton = screen.getByRole('button', { name: /clear job description/i });
    fireEvent.click(clearButton);
    expect(validationStatus).toHaveTextContent('invalid');
  });

  it('should handle multiple paste/clear cycles correctly', async () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Cycle 1: Paste
    fireEvent.change(textarea, { target: { value: 'First job description content' } });
    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe('First job description content');
    });

    // Cycle 1: Clear
    fireEvent.click(screen.getByRole('button', { name: /clear job description/i }));
    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBeNull();
    });

    // Cycle 2: Paste different content
    fireEvent.change(textarea, { target: { value: 'Second job description content' } });
    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe('Second job description content');
    });

    // Cycle 2: Clear
    fireEvent.click(screen.getByRole('button', { name: /clear job description/i }));
    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBeNull();
    });

    // Verify final state
    expect(textarea).toHaveValue('');
  });

  it('should show correct validation messages at different states', () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Empty state
    expect(screen.getByText(/required/i)).toBeInTheDocument();

    // Short text state
    fireEvent.change(textarea, { target: { value: 'Short' } });
    expect(screen.getByText(/minimum 50 required/i)).toBeInTheDocument();

    // Valid state
    const validText = 'a'.repeat(50);
    fireEvent.change(textarea, { target: { value: validText } });
    expect(screen.queryByText(/minimum 50 required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  });
});
