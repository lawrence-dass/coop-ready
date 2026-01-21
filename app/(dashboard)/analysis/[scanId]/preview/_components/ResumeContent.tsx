'use client'

import { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import type { MergedResumeContent } from '@/lib/utils/resume-merging'
import type { DisplaySuggestion } from '@/lib/utils/suggestion-types'

interface ResumeContentProps {
  mergedContent: Record<string, MergedResumeContent>
  scanId: string
  suggestions: DisplaySuggestion[]
}

const SECTION_TITLES: Record<string, string> = {
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  format: 'Formatting',
}

export function ResumeContent({
  mergedContent,
  scanId,
  suggestions,
}: ResumeContentProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(Object.keys(mergedContent).filter((k) => mergedContent[k].items.length > 0))
  )

  const toggleSection = (section: string) => {
    const next = new Set(expandedSections)
    if (next.has(section)) {
      next.delete(section)
    } else {
      next.add(section)
    }
    setExpandedSections(next)
  }

  return (
    <div className="p-8 space-y-8">
      {/* Top Action Button */}
      <div className="flex items-center gap-2 pb-6 border-b border-gray-200">
        <a
          href={`/analysis/${scanId}/suggestions`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Suggestions
        </a>
      </div>

      {/* Resume Sections */}
      {Object.entries(mergedContent).map(([sectionKey, section]) => {
        if (!section.items || section.items.length === 0) {
          return null
        }

        const sectionTitle = SECTION_TITLES[sectionKey] || sectionKey
        const isExpanded = expandedSections.has(sectionKey)
        const sectionSuggestions = suggestions.filter(
          (s) => s.section === sectionKey && s.status === 'accepted'
        )

        return (
          <div key={sectionKey} className="space-y-4">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(sectionKey)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                {sectionTitle}
                {sectionSuggestions.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    <Check className="h-3 w-3" />
                    {sectionSuggestions.length} updated
                  </span>
                )}
              </h2>
              <span
                className={`h-6 w-6 flex items-center justify-center transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              >
                ▼
              </span>
            </button>

            {/* Section Content */}
            {isExpanded && (
              <div className="space-y-4 pl-4 border-l-4 border-blue-200">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg ${
                      item.highlighted
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {/* Item Content with Diff Highlighting */}
                    <div className="prose prose-sm max-w-none">
                      {item.diff.length > 0 ? (
                        // Content with changes
                        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                          {item.diff.map((diff, i) => {
                            switch (diff.type) {
                              case 'added':
                                return (
                                  <span
                                    key={i}
                                    className="bg-green-200 text-green-900 font-semibold px-1 rounded"
                                  >
                                    {diff.text}
                                  </span>
                                )
                              case 'removed':
                                return (
                                  <span
                                    key={i}
                                    className="line-through text-gray-400"
                                  >
                                    {diff.text}
                                  </span>
                                )
                              default:
                                return <span key={i}>{diff.text}</span>
                            }
                          })}
                        </p>
                      ) : (
                        // Unchanged content
                        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                          {item.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Bottom Action */}
      <div className="flex gap-4 pt-8 border-t border-gray-200">
        <a
          href={`/analysis/${scanId}/suggestions`}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          Back to Suggestions
        </a>
      </div>
    </div>
  )
}
