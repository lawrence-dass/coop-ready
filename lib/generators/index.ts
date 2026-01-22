/**
 * Generators Barrel Export
 * Story 6.2: PDF Resume Generation
 * Story 6.3: DOCX Resume Generation
 */

// PDF Generator
export {
  generatePDF,
  generateFileName as generatePDFFileName,
  PDFGenerationError,
  DEFAULT_PDF_OPTIONS,
  type PDFGenerationOptions,
} from './pdf'

// DOCX Generator
export {
  generateDOCX,
  generateFileName as generateDOCXFileName,
  DOCXGenerationError,
  DEFAULT_DOCX_OPTIONS,
  type DOCXGenerationOptions,
} from './docx'

// Merge Generator
export {
  mergeResumeContent,
  type MergeResult,
  type DatabaseSuggestion,
} from './merge'
