'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap } from 'lucide-react'
import type { Skill } from '@/lib/parsers/types'

/**
 * Skills Preview Sub-Component
 *
 * Displays skills as chips/tags with visual distinction between
 * technical and soft skills using color coding.
 *
 * @see Story 3.4: Resume Preview Display - Task 3
 */

export interface SkillsPreviewProps {
  skills: Skill[]
}

export function SkillsPreview({ skills }: SkillsPreviewProps) {
  if (!skills || skills.length === 0) {
    return null
  }

  // Separate technical and soft skills for better organization
  const technicalSkills = skills.filter((s) => s.category === 'technical')
  const softSkills = skills.filter((s) => s.category === 'soft')

  return (
    <Card data-testid="skills-section">
      <CardHeader>
        <CardTitle
          className="flex items-center gap-2"
          data-testid="skills-section-header"
        >
          <Zap className="h-5 w-5" />
          Skills
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" data-testid="skills-section-content">
        {/* Technical Skills */}
        {technicalSkills.length > 0 && (
          <div data-testid="technical-skills-group">
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
              Technical Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {technicalSkills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100"
                  data-testid={`skill-chip-${skill.name}`}
                  data-category="technical"
                >
                  {skill.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Soft Skills */}
        {softSkills.length > 0 && (
          <div data-testid="soft-skills-group">
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
              Soft Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {softSkills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100"
                  data-testid={`skill-chip-${skill.name}`}
                  data-category="soft"
                >
                  {skill.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
