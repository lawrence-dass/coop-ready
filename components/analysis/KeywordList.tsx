'use client'

import { useState } from 'react'
import { ResultCard } from './ResultCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Key, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Keyword List Component
 *
 * Displays keywords found and missing from resume analysis.
 * Shows coverage percentage and allows expanding long lists.
 *
 * @see Story 4.7: Analysis Results Page - Task 6 (AC: 7)
 * @see Story 4.3: Missing Keywords Detection
 */

export interface Keyword {
  keyword: string
  frequency: number
  variant?: string
}

export interface MissingKeyword {
  keyword: string
  frequency: number
  priority: 'high' | 'medium' | 'low'
}

export interface KeywordListProps {
  keywordsFound: Keyword[] | null | undefined
  keywordsMissing: MissingKeyword[] | null | undefined
}

// Priority badge configuration
const priorityConfig = {
  high: { label: 'High', color: 'bg-red-100 text-red-800 border-red-200' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  low: { label: 'Low', color: 'bg-blue-100 text-blue-800 border-blue-200' },
} as const

export function KeywordList({ keywordsFound, keywordsMissing }: KeywordListProps) {
  const [showAllMissing, setShowAllMissing] = useState(false)
  const [showAllFound, setShowAllFound] = useState(false)

  const found = keywordsFound || []
  const missing = keywordsMissing || []

  // Calculate coverage based on high-priority missing keywords
  // Show "Great job" if no high-priority keywords are missing
  const highPriorityMissing = missing.filter((k) => k.priority === 'high')
  const hasGoodCoverage = highPriorityMissing.length === 0 && found.length > 0

  // Sort missing keywords by priority
  const sortedMissing = [...missing].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  // Show top 10 or all if expanded
  const displayedMissing = showAllMissing
    ? sortedMissing
    : sortedMissing.slice(0, 10)
  const displayedFound = showAllFound ? found : found.slice(0, 10)

  return (
    <ResultCard title="Keywords" icon={<Key className="h-5 w-5" />}>
      {hasGoodCoverage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">
              Great job! Your resume covers all high-priority keywords
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="missing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="missing">
            Missing ({missing.length})
          </TabsTrigger>
          <TabsTrigger value="found">Found ({found.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="missing" className="space-y-3 mt-4">
          {missing.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-600" />
              <p>No missing keywords detected!</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {displayedMissing.map((keyword, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{keyword.keyword}</span>
                      <span className="text-xs text-muted-foreground">
                        ({keyword.frequency}x in JD)
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={priorityConfig[keyword.priority].color}
                    >
                      {priorityConfig[keyword.priority].label}
                    </Badge>
                  </div>
                ))}
              </div>

              {missing.length > 10 && (
                <Button
                  variant="ghost"
                  onClick={() => setShowAllMissing(!showAllMissing)}
                  className="w-full"
                >
                  {showAllMissing ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show All {missing.length} Missing Keywords
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="found" className="space-y-3 mt-4">
          {found.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <XCircle className="h-12 w-12 mx-auto mb-2 text-orange-600" />
              <p>No matching keywords found</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {displayedFound.map((keyword, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-green-50/50"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{keyword.keyword}</span>
                    {keyword.variant && (
                      <span className="text-xs text-muted-foreground">
                        (matched via &quot;{keyword.variant}&quot;)
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {keyword.frequency}x
                    </span>
                  </div>
                ))}
              </div>

              {found.length > 10 && (
                <Button
                  variant="ghost"
                  onClick={() => setShowAllFound(!showAllFound)}
                  className="w-full"
                >
                  {showAllFound ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show All {found.length} Found Keywords
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </ResultCard>
  )
}
