/**
 * Integration Tests: Job Description Edit Flow
 *
 * Tests for Story 4.2 - Complete editing workflow with store integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JobDescriptionInput } from '@/components/shared/JobDescriptionInput';
import { useOptimizationStore } from '@/store';
import { isJobDescriptionValid } from '@/lib/validations/jobDescription';

// Test wrapper component that connects to store
function EditTestWrapper() {
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
      <div data-testid="char-count">{jobDescription?.length || 0}</div>
    </div>
  );
}

describe('Job Description Edit Flow Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    useOptimizationStore.getState().reset();
  });

  it('should handle paste → edit → verify state flow', async () => {
    render(<EditTestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Step 1: Paste initial text
    const initialText = 'Senior Software Engineer position requiring 5+ years experience';
    fireEvent.change(textarea, { target: { value: initialText } });

    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe(initialText);
    });

    // Step 2: Edit the text
    const editedText = 'Senior Software Engineer position requiring 5+ years of React experience';
    fireEvent.change(textarea, { target: { value: editedText } });

    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe(editedText);
    });

    // Step 3: Verify state is correct
    expect(textarea).toHaveValue(editedText);
    expect(screen.getByTestId('char-count')).toHaveTextContent(editedText.length.toString());
  });

  it('should handle multiple edit cycles in same session', async () => {
    render(<EditTestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Edit cycle 1
    fireEvent.change(textarea, { target: { value: 'First version of job description text' } });
    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe('First version of job description text');
    });

    // Edit cycle 2
    fireEvent.change(textarea, { target: { value: 'Second version of job description text' } });
    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe('Second version of job description text');
    });

    // Edit cycle 3
    fireEvent.change(textarea, { target: { value: 'Final version of job description text for posting' } });
    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe('Final version of job description text for posting');
    });

    // Verify final state
    expect(textarea).toHaveValue('Final version of job description text for posting');
  });

  it('should update validation status as user edits', async () => {
    render(<EditTestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');
    const validationStatus = screen.getByTestId('validation-status');

    // Initially invalid (empty)
    expect(validationStatus).toHaveTextContent('invalid');

    // Type short text - still invalid
    fireEvent.change(textarea, { target: { value: 'Short job description' } });
    await waitFor(() => {
      expect(validationStatus).toHaveTextContent('invalid');
    });

    // Edit to reach valid length (50+ chars)
    const validText = 'This is a comprehensive job description that is long enough to be considered valid for our system';
    fireEvent.change(textarea, { target: { value: validText } });
    await waitFor(() => {
      expect(validationStatus).toHaveTextContent('valid');
    });

    // Edit back to invalid
    fireEvent.change(textarea, { target: { value: 'Too short' } });
    await waitFor(() => {
      expect(validationStatus).toHaveTextContent('invalid');
    });
  });

  it('should preserve state consistency across rapid edits', async () => {
    render(<EditTestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Simulate rapid typing
    const edits = [
      'S',
      'Se',
      'Sen',
      'Seni',
      'Senio',
      'Senior',
      'Senior ',
      'Senior D',
      'Senior De',
      'Senior Dev',
      'Senior Developer',
    ];

    for (const text of edits) {
      fireEvent.change(textarea, { target: { value: text } });
    }

    // Wait for final state
    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe('Senior Developer');
    });

    // Verify no state corruption
    expect(textarea).toHaveValue('Senior Developer');
    expect(screen.getByTestId('char-count')).toHaveTextContent('16');
  });

  it('should handle edit + clear interaction correctly', async () => {
    render(<EditTestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Step 1: Edit text
    const text = 'Job description that will be cleared';
    fireEvent.change(textarea, { target: { value: text } });

    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe(text);
    });

    // Step 2: Clear via clear button
    const clearButton = screen.getByRole('button', { name: /clear job description/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBeNull();
    });

    // Step 3: Verify can edit again after clear
    const newText = 'New job description after clearing';
    fireEvent.change(textarea, { target: { value: newText } });

    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe(newText);
    });

    expect(textarea).toHaveValue(newText);
  });

  it('should maintain character count accuracy during edits', async () => {
    render(<EditTestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');
    const charCount = screen.getByTestId('char-count');

    // Edit with known lengths
    fireEvent.change(textarea, { target: { value: '12345' } }); // 5 chars
    await waitFor(() => {
      expect(charCount).toHaveTextContent('5');
    });

    fireEvent.change(textarea, { target: { value: '1234567890' } }); // 10 chars
    await waitFor(() => {
      expect(charCount).toHaveTextContent('10');
    });

    const fiftyChars = 'a'.repeat(50);
    fireEvent.change(textarea, { target: { value: fiftyChars } });
    await waitFor(() => {
      expect(charCount).toHaveTextContent('50');
    });
  });

  it('should handle paste followed by immediate edit', async () => {
    render(<EditTestWrapper />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Simulate paste
    const pastedText = 'Pasted job description content from external source';
    fireEvent.change(textarea, { target: { value: pastedText } });

    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe(pastedText);
    });

    // Immediately edit after paste
    const editedText = pastedText + ' with additional requirements';
    fireEvent.change(textarea, { target: { value: editedText } });

    await waitFor(() => {
      expect(useOptimizationStore.getState().jobDescription).toBe(editedText);
    });

    expect(textarea).toHaveValue(editedText);
  });
});
