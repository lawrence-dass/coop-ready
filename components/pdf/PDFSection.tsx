/**
 * PDFSection Component
 * Reusable section container with title
 * Story 6.2: PDF Resume Generation
 */

import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  content: {
    fontSize: 11,
    color: '#000000',
    lineHeight: 1.15,
  },
})

interface PDFSectionProps {
  title: string
  children: React.ReactNode
}

export function PDFSection({ title, children }: PDFSectionProps): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>
        {typeof children === 'string' ? (
          <Text>{children}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  )
}
