/**
 * Privacy Consent Flow Integration Tests
 *
 * Story 15.3: Gate Uploads Until Consent Accepted
 *
 * Tests the complete privacy consent flow:
 * - Consent check on file upload
 * - Dialog display for users without consent
 * - Consent acceptance and database update
 * - Consent bypass for authenticated users with consent
 * - Consent bypass for anonymous users
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import HomePage from '@/app/page';
import { useAuth } from '@/components/providers/AuthProvider';
import { getPrivacyConsent } from '@/actions/privacy/get-privacy-consent';
import { acceptPrivacyConsent } from '@/actions/privacy/accept-privacy-consent';
import { usePrivacyConsent } from '@/hooks/usePrivacyConsent';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock authentication provider
vi.mock('@/components/providers/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

// Mock privacy consent actions
vi.mock('@/actions/privacy/get-privacy-consent', () => ({
  getPrivacyConsent: vi.fn(),
}));

vi.mock('@/actions/privacy/accept-privacy-consent', () => ({
  acceptPrivacyConsent: vi.fn(),
}));

// Mock other dependencies
vi.mock('@/actions/preferences', () => ({
  getPreferences: vi.fn(() =>
    Promise.resolve({
      data: {
        tone: 'professional',
        verbosity: 'balanced',
        emphasis: 'achievements',
        industry: 'technology',
        experienceLevel: 'mid',
        jobType: 'full-time',
        modificationLevel: 'moderate',
      },
      error: null,
    })
  ),
}));

vi.mock('@/hooks', () => ({
  useResumeExtraction: vi.fn(() => ({
    extract: vi.fn(),
    isPending: false,
  })),
  MIME_TYPE_PDF: 'application/pdf',
  MIME_TYPE_DOCX:
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}));

vi.mock('@/hooks/usePrivacyConsent', () => ({
  usePrivacyConsent: vi.fn(),
}));

// Mock Zustand store
const mockStoreState = {
  sessionId: null,
  pendingFile: null,
  resumeContent: null,
  jobDescription: '',
  isGeneratingOutput: false,
  isExtracting: false,
  isParsing: false,
  generatedOutput: null,
  suggestions: null,
  summarySuggestion: null,
  skillsSuggestion: null,
  experienceSuggestion: null,
  isLoading: false,
  loadingStep: null,
  fileError: null,
  optimizationError: null,
  generalError: null,
  keywordAnalysis: null,
  atsScore: null,
  retryCount: 0,
  isRetrying: false,
  lastError: null,
  suggestionFeedback: new Map(),
  selectedResumeId: null,
  isRegeneratingSection: {},
  showPreferencesDialog: false,
  showPrivacyDialog: false,
  privacyAccepted: undefined,
  privacyAcceptedAt: undefined,
  pendingFileForConsent: null,
  setPendingFile: vi.fn((file) => { mockStoreState.pendingFile = file; }),
  setResumeContent: vi.fn(),
  setJobDescription: vi.fn(),
  setSuggestions: vi.fn(),
  setGeneratedOutput: vi.fn(),
  setIsLoading: vi.fn(),
  setLoadingStep: vi.fn(),
  setFileError: vi.fn((error) => { mockStoreState.fileError = error; }),
  setOptimizationError: vi.fn(),
  setShowPreferencesDialog: vi.fn((show) => { mockStoreState.showPreferencesDialog = show; }),
  setShowPrivacyDialog: vi.fn((show) => { mockStoreState.showPrivacyDialog = show; }),
  setPrivacyAccepted: vi.fn((accepted, acceptedAt) => {
    mockStoreState.privacyAccepted = accepted;
    mockStoreState.privacyAcceptedAt = acceptedAt;
  }),
  setPendingFileForConsent: vi.fn((file) => { mockStoreState.pendingFileForConsent = file; }),
  setUserPreferences: vi.fn(),
  reset: vi.fn(),
};

vi.mock('@/store/useOptimizationStore', () => ({
  useOptimizationStore: (selector?: (state: typeof mockStoreState) => unknown) =>
    selector ? selector(mockStoreState) : mockStoreState,
}));

vi.mock('@/store', () => ({
  useOptimizationStore: (selector?: (state: typeof mockStoreState) => unknown) =>
    selector ? selector(mockStoreState) : mockStoreState,
  selectPendingFile: (state: typeof mockStoreState) => state.pendingFile,
  selectFileError: (state: typeof mockStoreState) => state.fileError,
  selectJobDescription: (state: typeof mockStoreState) => state.jobDescription,
  selectKeywordAnalysis: (state: typeof mockStoreState) => state.keywordAnalysis,
  selectATSScore: (state: typeof mockStoreState) => state.atsScore,
  selectGeneralError: (state: typeof mockStoreState) => state.generalError,
  selectRetryCount: (state: typeof mockStoreState) => state.retryCount,
  selectIsRetrying: (state: typeof mockStoreState) => state.isRetrying,
}));

describe('Privacy Consent Flow Integration', () => {
  const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
  const mockGetPrivacyConsent = getPrivacyConsent as ReturnType<typeof vi.fn>;
  const mockAcceptPrivacyConsent = acceptPrivacyConsent as ReturnType<
    typeof vi.fn
  >;
  const mockUsePrivacyConsent = usePrivacyConsent as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    mockStoreState.pendingFile = null;
    mockStoreState.showPrivacyDialog = false;
    mockStoreState.showPreferencesDialog = false;
    mockStoreState.privacyAccepted = undefined;
    mockStoreState.privacyAcceptedAt = undefined;
    mockStoreState.pendingFileForConsent = null;
    mockStoreState.fileError = null;
  });

  describe('AC #1: Dialog appears for authenticated users without consent', () => {
    it('shows privacy consent dialog when authenticated user uploads file and has not consented', async () => {
      const user = userEvent.setup();

      // Setup: Authenticated user, no consent
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'user-123', email: 'test@example.com' },
      });

      mockUsePrivacyConsent.mockReturnValue({
        privacyAccepted: false,
        privacyAcceptedAt: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockGetPrivacyConsent.mockResolvedValue({
        data: {
          privacyAccepted: false,
          privacyAcceptedAt: null,
        },
        error: null,
      });

      render(<HomePage />);

      // Create a mock PDF file
      const file = new File(['test content'], 'resume.pdf', {
        type: 'application/pdf',
      });

      // Trigger file upload
      const fileInput = screen.getByLabelText(/upload.*resume/i);
      await user.upload(fileInput, file);

      // Privacy consent dialog should appear
      await waitFor(() => {
        expect(
          screen.getByRole('dialog', { name: /Privacy.*Data Handling/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('AC #2: Consent acceptance updates database', () => {
    it('updates privacy_accepted and privacy_accepted_at when user accepts', async () => {
      const user = userEvent.setup();
      const mockTimestamp = new Date();

      // Setup: Authenticated user, no consent
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'user-123', email: 'test@example.com' },
      });

      mockUsePrivacyConsent.mockReturnValue({
        privacyAccepted: false,
        privacyAcceptedAt: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockGetPrivacyConsent.mockResolvedValue({
        data: {
          privacyAccepted: false,
          privacyAcceptedAt: null,
        },
        error: null,
      });

      mockAcceptPrivacyConsent.mockResolvedValue({
        data: {
          privacyAccepted: true,
          privacyAcceptedAt: mockTimestamp,
        },
        error: null,
      });

      render(<HomePage />);

      // Trigger file upload
      const file = new File(['test content'], 'resume.pdf', {
        type: 'application/pdf',
      });
      const fileInput = screen.getByLabelText(/upload.*resume/i);
      await user.upload(fileInput, file);

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check the checkbox
      const checkbox = screen.getByRole('checkbox', {
        name: /I understand how my data will be handled/i,
      });
      await user.click(checkbox);

      // Click "I Agree"
      const agreeButton = screen.getByRole('button', { name: /I Agree/i });
      await user.click(agreeButton);

      // Verify acceptPrivacyConsent was called
      await waitFor(() => {
        expect(mockAcceptPrivacyConsent).toHaveBeenCalled();
      });
    });
  });

  describe('AC #3: No dialog for authenticated users with consent', () => {
    it('does not show dialog when authenticated user has already consented', async () => {
      const user = userEvent.setup();

      // Setup: Authenticated user, consent already given
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'user-123', email: 'test@example.com' },
      });

      mockUsePrivacyConsent.mockReturnValue({
        privacyAccepted: true,
        privacyAcceptedAt: new Date('2026-01-15'),
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockGetPrivacyConsent.mockResolvedValue({
        data: {
          privacyAccepted: true,
          privacyAcceptedAt: new Date('2026-01-15'),
        },
        error: null,
      });

      render(<HomePage />);

      // Trigger file upload
      const file = new File(['test content'], 'resume.pdf', {
        type: 'application/pdf',
      });
      const fileInput = screen.getByLabelText(/upload.*resume/i);
      await user.upload(fileInput, file);

      // Dialog should NOT appear
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('AC #4: Dialog does not re-appear after acceptance', () => {
    it('does not show dialog on subsequent uploads after accepting consent', async () => {
      const user = userEvent.setup();
      const mockTimestamp = new Date();

      // Setup: Start with no consent
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'user-123', email: 'test@example.com' },
      });

      let consentAccepted = false;

      mockUsePrivacyConsent.mockImplementation(() => ({
        privacyAccepted: consentAccepted,
        privacyAcceptedAt: consentAccepted ? mockTimestamp : null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      }));

      mockGetPrivacyConsent.mockImplementation(() => {
        return Promise.resolve({
          data: {
            privacyAccepted: consentAccepted,
            privacyAcceptedAt: consentAccepted ? mockTimestamp : null,
          },
          error: null,
        });
      });

      mockAcceptPrivacyConsent.mockImplementation(() => {
        consentAccepted = true;
        return Promise.resolve({
          data: {
            privacyAccepted: true,
            privacyAcceptedAt: mockTimestamp,
          },
          error: null,
        });
      });

      const { rerender } = render(<HomePage />);

      // First upload - should show dialog
      const file1 = new File(['test content'], 'resume.pdf', {
        type: 'application/pdf',
      });
      const fileInput = screen.getByLabelText(/upload.*resume/i);
      await user.upload(fileInput, file1);

      // Dialog appears
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Accept consent
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      const agreeButton = screen.getByRole('button', { name: /I Agree/i });
      await user.click(agreeButton);

      // Wait for dialog to close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Rerender to simulate state update
      rerender(<HomePage />);

      // Second upload - should NOT show dialog
      const file2 = new File(['test content 2'], 'resume2.pdf', {
        type: 'application/pdf',
      });
      await user.upload(fileInput, file2);

      // Dialog should NOT re-appear
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('AC #5: Anonymous users bypass consent check', () => {
    it('does not show dialog for anonymous users', async () => {
      const user = userEvent.setup();

      // Setup: Anonymous user
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      mockUsePrivacyConsent.mockReturnValue({
        privacyAccepted: null,
        privacyAcceptedAt: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockGetPrivacyConsent.mockResolvedValue({
        data: null, // Null indicates anonymous user
        error: null,
      });

      render(<HomePage />);

      // Trigger file upload
      const file = new File(['test content'], 'resume.pdf', {
        type: 'application/pdf',
      });
      const fileInput = screen.getByLabelText(/upload.*resume/i);
      await user.upload(fileInput, file);

      // Dialog should NOT appear for anonymous users
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error toast when consent acceptance fails', async () => {
      const user = userEvent.setup();

      // Setup
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'user-123', email: 'test@example.com' },
      });

      mockUsePrivacyConsent.mockReturnValue({
        privacyAccepted: false,
        privacyAcceptedAt: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockGetPrivacyConsent.mockResolvedValue({
        data: {
          privacyAccepted: false,
          privacyAcceptedAt: null,
        },
        error: null,
      });

      mockAcceptPrivacyConsent.mockResolvedValue({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Database update failed',
        },
      });

      render(<HomePage />);

      // Upload file
      const file = new File(['test'], 'resume.pdf', {
        type: 'application/pdf',
      });
      const fileInput = screen.getByLabelText(/upload.*resume/i);
      await user.upload(fileInput, file);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Accept consent
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      const agreeButton = screen.getByRole('button', { name: /I Agree/i });
      await user.click(agreeButton);

      // Error toast should be shown (dialog stays open)
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Database update failed');
      });
    });
  });
});
