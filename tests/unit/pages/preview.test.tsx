/**
 * Integration Tests for Resume Preview Page
 * Story 5.8: Optimized Resume Preview
 */

import { render, screen } from '@testing-library/react'
import PreviewPage from '@/app/(dashboard)/analysis/[scanId]/preview/page'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({
          data: { user: { id: 'user-1' } },
          error: null,
        })
      ),
    },
    from: jest.fn((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() =>
        Promise.resolve({
          data:
            table === 'scans'
              ? {
                  id: 'scan-1',
                  user_id: 'user-1',
                  parsed_resume: {
                    experience: [
                      {
                        company: 'TechCorp',
                        title: 'Developer',
                        dates: '2020-01 to 2023-12',
                        bulletPoints: ['Built features'],
                      },
                    ],
                    education: [],
                    skills: [],
                  },
                  job_description: 'React developer role',
                  created_at: '2026-01-21T00:00:00Z',
                }
              : null,
          error: null,
        })
      ),
      order: jest.fn().mockReturnThis(),
    })),
  })),
}))

describe('Preview Page', () => {
  it('should render "No changes" state when no suggestions accepted', async () => {
    const params = { scanId: 'scan-1' }
    const component = await PreviewPage({ params })
    render(component)

    expect(screen.getByText('No Changes Applied')).toBeInTheDocument()
  })

  it('should display accepted suggestions count', async () => {
    const params = { scanId: 'scan-1' }
    const component = await PreviewPage({ params })
    render(component)

    expect(screen.getByText(/updated/)).toBeInTheDocument()
  })

  it('should show back button to suggestions', async () => {
    const params = { scanId: 'scan-1' }
    const component = await PreviewPage({ params })
    render(component)

    const backButton = screen.getByText('Back to Review')
    expect(backButton).toBeInTheDocument()
    expect(backButton).toHaveAttribute('href', '/analysis/scan-1/suggestions')
  })

  it('should display progress indicator', async () => {
    const params = { scanId: 'scan-1' }
    const component = await PreviewPage({ params })
    render(component)

    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument()
  })

  it('should display stat cards for suggestions', async () => {
    const params = { scanId: 'scan-1' }
    const component = await PreviewPage({ params })
    render(component)

    expect(screen.getByText('Total Suggestions')).toBeInTheDocument()
    expect(screen.getByText('Accepted')).toBeInTheDocument()
    expect(screen.getByText('Rejected')).toBeInTheDocument()
    expect(screen.getByText('Completion')).toBeInTheDocument()
  })
})
