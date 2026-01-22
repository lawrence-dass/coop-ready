/**
 * PDFExperienceEntry Component
 * Formats a single job experience entry
 * Story 6.2: PDF Resume Generation
 */

import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { JobEntry } from '@/lib/parsers/types'
import { PDFBulletList } from './PDFBulletList'

const styles = StyleSheet.create({
  entry: {
    marginBottom: 10,
  },
  headerLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  company: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  jobTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#000000',
  },
  dates: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333333',
  },
})

interface PDFExperienceEntryProps {
  entry: JobEntry
  isLast?: boolean
}

export function PDFExperienceEntry({ entry, isLast = false }: PDFExperienceEntryProps): React.ReactElement {
  const entryStyle = isLast ? [styles.entry, { marginBottom: 0 }] : styles.entry

  return (
    <View style={entryStyle}>
      <View style={styles.headerLine}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Text style={styles.company}>{entry.company}</Text>
          <Text style={styles.jobTitle}>| {entry.title}</Text>
        </View>
        <Text style={styles.dates}>{entry.dates}</Text>
      </View>
      {entry.bulletPoints && entry.bulletPoints.length > 0 && (
        <PDFBulletList bullets={entry.bulletPoints} />
      )}
    </View>
  )
}
