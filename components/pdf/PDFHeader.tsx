/**
 * PDFHeader Component
 * Contact information section at the top of resume
 * Story 6.2: PDF Resume Generation
 */

import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ParsedResume } from '@/lib/parsers/types'

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
    borderBottom: '1pt solid #333333',
    paddingBottom: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#000000',
  },
  contactInfo: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.3,
  },
})

interface PDFHeaderProps {
  resume: ParsedResume
}

export function PDFHeader({ resume }: PDFHeaderProps): React.ReactElement {
  // Parse contact info to extract name for header
  // Contact format is typically: "Name\nEmail | Phone | Location"
  const contactLines = resume.contact.split('\n')
  const name = contactLines[0] || 'Resume'
  const contactDetails = contactLines.slice(1).join(' ')

  return (
    <View style={styles.header}>
      <Text style={styles.name}>{name}</Text>
      {contactDetails && (
        <Text style={styles.contactInfo}>{contactDetails}</Text>
      )}
    </View>
  )
}
