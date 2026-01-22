/**
 * PDFSkillsList Component
 * Formats skills section with categories
 * Story 6.2: PDF Resume Generation
 */

import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { Skill } from '@/lib/parsers/types'

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    width: 80,
  },
  skillsList: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#000000',
    lineHeight: 1.15,
  },
})

interface PDFSkillsListProps {
  skills: Skill[]
  categoryLabels?: boolean
}

export function PDFSkillsList({ skills, categoryLabels = true }: PDFSkillsListProps): React.ReactElement {
  // Group skills by category
  const technicalSkills = skills.filter((s) => s.category === 'technical')
  const softSkills = skills.filter((s) => s.category === 'soft')

  if (!categoryLabels) {
    // Simple comma-separated list
    const skillNames = skills.map((s) => s.name).join(', ')
    return (
      <View>
        <Text style={styles.skillsList}>{skillNames}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {technicalSkills.length > 0 && (
        <View style={styles.categoryRow}>
          <Text style={styles.categoryLabel}>Technical:</Text>
          <Text style={styles.skillsList}>
            {technicalSkills.map((s) => s.name).join(', ')}
          </Text>
        </View>
      )}
      {softSkills.length > 0 && (
        <View style={styles.categoryRow}>
          <Text style={styles.categoryLabel}>Soft Skills:</Text>
          <Text style={styles.skillsList}>
            {softSkills.map((s) => s.name).join(', ')}
          </Text>
        </View>
      )}
    </View>
  )
}
