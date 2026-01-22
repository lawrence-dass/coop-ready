/**
 * PDFBulletList Component
 * Formats bullet points for experience entries
 * Story 6.2: PDF Resume Generation
 */

import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  bulletContainer: {
    marginTop: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bullet: {
    width: 12,
    fontSize: 10,
    color: '#000000',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#000000',
    lineHeight: 1.15,
  },
})

interface PDFBulletListProps {
  bullets: string[]
}

export function PDFBulletList({ bullets }: PDFBulletListProps): React.ReactElement {
  return (
    <View style={styles.bulletContainer}>
      {bullets.map((bullet, index) => (
        <View key={index} style={styles.bulletItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      ))}
    </View>
  )
}
