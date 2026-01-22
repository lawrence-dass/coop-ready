/**
 * PDFEducationEntry Component
 * Formats a single education entry
 * Story 6.2: PDF Resume Generation
 */

import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { EducationEntry } from '@/lib/parsers/types'

const styles = StyleSheet.create({
  entry: {
    marginBottom: 8,
  },
  headerLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  institution: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  degree: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#000000',
  },
  dates: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333333',
  },
  gpa: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333333',
    marginTop: 2,
  },
})

interface PDFEducationEntryProps {
  entry: EducationEntry
  isLast?: boolean
}

export function PDFEducationEntry({ entry, isLast = false }: PDFEducationEntryProps): React.ReactElement {
  const entryStyle = isLast ? [styles.entry, { marginBottom: 0 }] : styles.entry

  return (
    <View style={entryStyle}>
      <View style={styles.headerLine}>
        <View>
          <Text style={styles.institution}>{entry.institution}</Text>
          <Text style={styles.degree}>{entry.degree}</Text>
          {entry.gpa && <Text style={styles.gpa}>GPA: {entry.gpa}</Text>}
        </View>
        <Text style={styles.dates}>{entry.dates}</Text>
      </View>
    </View>
  )
}
