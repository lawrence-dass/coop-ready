#!/usr/bin/env tsx
/**
 * Analysis Quality Validation Script
 *
 * Purpose: Validate 50 resume analyses to measure extraction error rates
 *
 * Usage:
 *   npm run validate:analysis
 *
 * Output:
 *   - validation-results-[timestamp].json (raw data)
 *   - validation-report-[timestamp].md (human-readable report)
 *
 * Process:
 *   1. Load resume + JD test cases
 *   2. Run optimization pipeline
 *   3. Capture all intermediate extractions
 *   4. Output for manual expert review
 *   5. Calculate error rates from reviews
 */

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { extractKeywords } from '../lib/ai/extractKeywords';
import { extractQualificationsBoth } from '../lib/ai/extractQualifications';
import { matchKeywords } from '../lib/ai/matchKeywords';
import { calculateATSScoreV21Full } from '../lib/ai/calculateATSScore';
import { detectJobType } from '../lib/scoring';
import type { Resume } from '../types/optimization';
import * as fs from 'fs';

// ============================================================================
// TYPES
// ============================================================================

interface TestCase {
  id: string;
  name: string;
  resume: string;
  jd: string;
  source: 'real' | 'synthetic' | 'edge_case';
  notes?: string;
}

interface ValidationResult {
  testCaseId: string;
  testCaseName: string;
  timestamp: string;

  // Raw inputs
  resume: string;
  jd: string;

  // Extraction results
  keywords: {
    extracted: any;
    error: any;
  };
  qualifications: {
    extracted: any;
    error: any;
  };
  matches: {
    extracted: any;
    error: any;
  };
  atsScore: {
    calculated: any;
    error: any;
  };

  // For manual review
  reviewNotes: {
    keywordExtractionQuality: 'good' | 'minor_issues' | 'major_issues' | null;
    keywordExtractionErrors: string[];
    matchingQuality: 'good' | 'minor_issues' | 'major_issues' | null;
    matchingErrors: string[];
    qualificationQuality: 'good' | 'minor_issues' | 'major_issues' | null;
    qualificationErrors: string[];
    overallAssessment: string;
    criticalIssues: boolean;
  };
}

// ============================================================================
// TEST CASES
// ============================================================================

/**
 * Load test cases from file or generate synthetic ones
 *
 * TODO: Replace with real user data (anonymized) when available
 */
function loadTestCases(): TestCase[] {
  // For now, return synthetic test cases
  // In production, load from: scripts/validation-test-cases.json

  return [
    {
      id: 'tc-001',
      name: 'Software Engineer - React/TypeScript',
      source: 'synthetic',
      jd: `Senior Software Engineer

We are seeking an experienced Software Engineer to join our team. The ideal candidate will have:

Requirements:
- 5+ years of professional software development experience
- Strong proficiency in React and TypeScript
- Experience with Node.js and Express
- Bachelor's degree in Computer Science or related field
- Excellent problem-solving and communication skills

Nice to have:
- Experience with GraphQL
- AWS or cloud deployment experience
- Previous startup experience`,

      resume: `John Doe
john.doe@email.com | 555-1234

PROFESSIONAL SUMMARY
Software engineer with 6 years of experience building scalable web applications using modern JavaScript frameworks and cloud technologies.

SKILLS
JavaScript, TypeScript, React, Node.js, Express, MongoDB, AWS, Docker, Git

EXPERIENCE

Senior Software Engineer | Tech Corp | 2020 - Present
- Led development of customer-facing web application serving 50K+ daily users
- Architected and implemented RESTful APIs using Node.js and Express
- Collaborated with cross-functional teams to deliver features on schedule
- Mentored junior developers on best practices and code review

Software Engineer | StartupCo | 2018 - 2020
- Built responsive web interfaces using React and TypeScript
- Implemented user authentication and authorization systems
- Deployed applications to AWS using Docker containers
- Participated in agile development process with 2-week sprints

EDUCATION
Bachelor of Science in Computer Science | University of State | 2018`
    },

    {
      id: 'tc-002',
      name: 'Data Scientist - ML/Python',
      source: 'synthetic',
      jd: `Data Scientist

Join our data science team to build predictive models and drive data-driven decision making.

Requirements:
- PhD or Master's in Data Science, Statistics, or related field
- 3+ years of experience in machine learning
- Expert in Python (scikit-learn, pandas, NumPy)
- Experience with deep learning frameworks (TensorFlow or PyTorch)
- Strong statistical analysis skills

Preferred:
- Experience with NLP or computer vision
- Published research in top-tier conferences
- Experience with big data tools (Spark, Hadoop)`,

      resume: `Jane Smith
jane.smith@email.com

SUMMARY
Data scientist specializing in machine learning and predictive analytics with 4 years of industry experience.

TECHNICAL SKILLS
Python, R, SQL, scikit-learn, pandas, TensorFlow, Jupyter, Git, AWS

EXPERIENCE

Data Scientist | Data Corp | 2021 - Present
- Developed machine learning models achieving 92% accuracy for customer churn prediction
- Built NLP pipeline for sentiment analysis of customer reviews
- Collaborated with engineering team to deploy models to production
- Presented findings to stakeholders through data visualizations

Junior Data Scientist | Analytics Inc | 2020 - 2021
- Performed exploratory data analysis on large datasets
- Created predictive models using regression and classification algorithms
- Automated reporting dashboards using Python and SQL

EDUCATION
Master of Science in Data Science | Tech University | 2020
Bachelor of Science in Mathematics | State College | 2018

PUBLICATIONS
- "Improving Churn Prediction Using Ensemble Methods" - ML Conference 2022`
    },

    {
      id: 'tc-003',
      name: 'Product Manager - B2B SaaS',
      source: 'synthetic',
      jd: `Product Manager

We're looking for a PM to drive our B2B SaaS product strategy.

Responsibilities:
- Define product roadmap and strategy
- Conduct user research and market analysis
- Work with engineering, design, and sales teams
- Launch new features and measure impact

Requirements:
- 3-5 years of product management experience
- Experience with B2B SaaS products
- Strong analytical and communication skills
- Ability to work with technical teams
- MBA or relevant experience preferred`,

      resume: `Alex Johnson
alex.j@email.com

Product Manager with 4 years of experience building and scaling SaaS products.

EXPERIENCE

Product Manager | SaaS Company | 2021 - Present
- Manage product roadmap for enterprise collaboration platform
- Launched 15+ features resulting in 40% increase in user engagement
- Conduct quarterly user research sessions with 50+ customers
- Partner with engineering to prioritize backlog and define requirements

Associate Product Manager | Software Inc | 2020 - 2021
- Supported PM team on B2C mobile app with 100K+ users
- Analyzed user behavior data to identify improvement opportunities
- Wrote product specs and user stories for development team

Business Analyst | Consulting Firm | 2018 - 2020
- Performed market research and competitive analysis
- Created financial models and business cases

EDUCATION
MBA | Business School | 2020
BS Economics | University | 2018`
    },

    // Add more test cases below
    // TODO: Add edge cases, tricky semantic matching cases, etc.
  ];
}

// ============================================================================
// VALIDATION EXECUTION
// ============================================================================

/**
 * Run analysis pipeline on a single test case
 */
async function runAnalysis(testCase: TestCase): Promise<ValidationResult> {
  console.log(`\n[Validation] Running analysis for: ${testCase.name}`);

  const result: ValidationResult = {
    testCaseId: testCase.id,
    testCaseName: testCase.name,
    timestamp: new Date().toISOString(),
    resume: testCase.resume,
    jd: testCase.jd,
    keywords: { extracted: null, error: null },
    qualifications: { extracted: null, error: null },
    matches: { extracted: null, error: null },
    atsScore: { calculated: null, error: null },
    reviewNotes: {
      keywordExtractionQuality: null,
      keywordExtractionErrors: [],
      matchingQuality: null,
      matchingErrors: [],
      qualificationQuality: null,
      qualificationErrors: [],
      overallAssessment: '',
      criticalIssues: false,
    }
  };

  try {
    // Step 1: Extract keywords
    console.log('  - Extracting keywords...');
    const keywordResult = await extractKeywords(testCase.jd);
    if (keywordResult.error) {
      result.keywords.error = keywordResult.error;
    } else {
      result.keywords.extracted = keywordResult.data;
    }

    // Step 2: Extract qualifications
    console.log('  - Extracting qualifications...');
    const qualResult = await extractQualificationsBoth(testCase.jd, testCase.resume);
    if (qualResult.error) {
      result.qualifications.error = qualResult.error;
    } else {
      result.qualifications.extracted = qualResult.data;
    }

    // Step 3: Match keywords (only if extraction succeeded)
    if (result.keywords.extracted) {
      console.log('  - Matching keywords...');
      const matchResult = await matchKeywords(testCase.resume, result.keywords.extracted.keywords);
      if (matchResult.error) {
        result.matches.error = matchResult.error;
      } else {
        result.matches.extracted = matchResult.data;
      }
    }

    // Step 4: Calculate ATS score (only if previous steps succeeded)
    if (result.keywords.extracted && result.qualifications.extracted && result.matches.extracted) {
      console.log('  - Calculating ATS score...');

      const jobType = detectJobType(testCase.jd);
      const parsedResume: Resume = {
        rawText: testCase.resume,
      };

      const scoreResult = await calculateATSScoreV21Full({
        keywordMatches: result.matches.extracted.matched,
        extractedKeywords: result.keywords.extracted.keywords,
        jdQualifications: result.qualifications.extracted.jdQualifications,
        resumeQualifications: result.qualifications.extracted.resumeQualifications,
        parsedResume,
        jdContent: testCase.jd,
        jobType,
      });

      if (scoreResult.error) {
        result.atsScore.error = scoreResult.error;
      } else {
        result.atsScore.calculated = scoreResult.data;
      }
    }

    console.log('  ✓ Analysis complete');
  } catch (error) {
    console.error('  ✗ Analysis failed:', error);
    result.atsScore.error = {
      code: 'VALIDATION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  return result;
}

/**
 * Run validation on all test cases
 */
async function runValidation() {
  console.log('='.repeat(70));
  console.log('ANALYSIS QUALITY VALIDATION');
  console.log('='.repeat(70));

  const testCases = loadTestCases();
  console.log(`\nLoaded ${testCases.length} test cases`);

  const results: ValidationResult[] = [];

  for (const testCase of testCases) {
    const result = await runAnalysis(testCase);
    results.push(result);

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputDir = path.join(process.cwd(), 'validation-results');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const resultsFile = path.join(outputDir, `validation-results-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

  console.log(`\n${'='.repeat(70)}`);
  console.log(`✓ Validation complete!`);
  console.log(`✓ Results saved to: ${resultsFile}`);
  console.log(`${'='.repeat(70)}\n`);

  // Generate review worksheet
  generateReviewWorksheet(results, timestamp);
}

/**
 * Generate human-readable review worksheet
 */
function generateReviewWorksheet(results: ValidationResult[], timestamp: string) {
  const outputDir = path.join(process.cwd(), 'validation-results');
  const worksheetFile = path.join(outputDir, `validation-worksheet-${timestamp}.md`);

  let markdown = `# Analysis Quality Validation Worksheet

**Generated:** ${new Date().toISOString()}
**Test Cases:** ${results.length}
**Reviewer:** _[Your Name]_

---

## Instructions

For each test case below, review the extractions and rate the quality:

**Rating Scale:**
- **GOOD**: No issues, accurate extraction
- **MINOR_ISSUES**: Small mistakes, wouldn't significantly harm user
- **MAJOR_ISSUES**: Critical errors that would lead to bad advice

**For each issue found, document:**
1. What was extracted incorrectly?
2. What should have been extracted?
3. User impact: Would this lead to harmful advice?

---

`;

  results.forEach((result, index) => {
    markdown += `## Test Case ${index + 1}: ${result.testCaseName}

**Test ID:** ${result.testCaseId}

---

### 📄 Job Description

\`\`\`
${result.jd.trim()}
\`\`\`

---

### 📄 Resume

\`\`\`
${result.resume.trim()}
\`\`\`

---

### 🔍 Extraction Results

#### 1. Keyword Extraction

${result.keywords.error ? `❌ **ERROR:** ${result.keywords.error.message}` : ''}

${result.keywords.extracted ? `
**Extracted Keywords:**
\`\`\`json
${JSON.stringify(result.keywords.extracted.keywords, null, 2)}
\`\`\`

**Total Keywords:** ${result.keywords.extracted.keywords.length}
**Required:** ${result.keywords.extracted.keywords.filter((k: any) => k.requirement === 'required').length}
**Preferred:** ${result.keywords.extracted.keywords.filter((k: any) => k.requirement === 'preferred').length}
` : ''}

**✏️ REVIEW - Keyword Extraction Quality:**
- [ ] GOOD - All important keywords captured, no hallucinations
- [ ] MINOR_ISSUES - Small omissions or extras, acceptable
- [ ] MAJOR_ISSUES - Missing critical keywords OR significant hallucinations

**Issues Found:**
1. _[e.g., "Missed 'Python' which is mentioned 3 times in JD"]_
2. _[e.g., "Hallucinated 'React Native' which isn't in JD"]_

---

#### 2. Qualification Extraction

${result.qualifications.error ? `❌ **ERROR:** ${result.qualifications.error.message}` : ''}

${result.qualifications.extracted ? `
**JD Requirements:**
\`\`\`json
${JSON.stringify(result.qualifications.extracted.jdQualifications, null, 2)}
\`\`\`

**Resume Qualifications:**
\`\`\`json
${JSON.stringify(result.qualifications.extracted.resumeQualifications, null, 2)}
\`\`\`
` : ''}

**✏️ REVIEW - Qualification Extraction Quality:**
- [ ] GOOD - All requirements captured accurately
- [ ] MINOR_ISSUES - Minor misinterpretation, acceptable
- [ ] MAJOR_ISSUES - Missed critical requirements OR wrong interpretation

**Issues Found:**
1. _[e.g., "Missed 'PhD required' from JD"]_
2. _[e.g., "Extracted 6 years but resume says 4 years"]_

---

#### 3. Keyword Matching

${result.matches.error ? `❌ **ERROR:** ${result.matches.error.message}` : ''}

${result.matches.extracted ? `
**Match Rate:** ${result.matches.extracted.matchRate}%
**Matched Keywords:** ${result.matches.extracted.matched?.length || 0}
**Missing Keywords:** ${result.matches.extracted.missing?.length || 0}

**Matched:**
\`\`\`json
${JSON.stringify(result.matches.extracted.matched, null, 2)}
\`\`\`

**Missing:**
\`\`\`json
${JSON.stringify(result.matches.extracted.missing, null, 2)}
\`\`\`
` : ''}

**✏️ REVIEW - Keyword Matching Quality:**
- [ ] GOOD - All matches accurate, no false positives/negatives
- [ ] MINOR_ISSUES - Few incorrect matches, acceptable
- [ ] MAJOR_ISSUES - Significant false positives OR false negatives

**Issues Found:**
1. _[e.g., "False positive: 'React' matched 'reactive personality'"]_
2. _[e.g., "False negative: Missed 'Node' when resume has 'Node.js'"]_

---

#### 4. ATS Score

${result.atsScore.error ? `❌ **ERROR:** ${result.atsScore.error.message}` : ''}

${result.atsScore.calculated ? `
**Overall Score:** ${result.atsScore.calculated.overall}/100
**Tier:** ${result.atsScore.calculated.tier}

**Breakdown:**
- Keywords: ${result.atsScore.calculated.breakdownV21?.keywords?.score || 'N/A'}
- Qualification Fit: ${result.atsScore.calculated.breakdownV21?.qualificationFit?.score || 'N/A'}
- Content Quality: ${result.atsScore.calculated.breakdownV21?.contentQuality?.score || 'N/A'}
- Sections: ${result.atsScore.calculated.breakdownV21?.sections?.score || 'N/A'}
- Format: ${result.atsScore.calculated.breakdownV21?.format?.score || 'N/A'}
` : ''}

---

### ✅ Overall Assessment

**Critical Issues (would harm user if we shipped this):**
- [ ] YES - This analysis has critical errors that would lead to bad advice
- [ ] NO - This analysis is acceptable quality

**Overall Quality Rating:**
- [ ] HIGH QUALITY - Would confidently ship this
- [ ] ACCEPTABLE - Minor issues but won't harm user
- [ ] UNACCEPTABLE - Would lead to bad advice, needs fixing

**Summary:**
_[Your assessment of this test case]_

---

`;
  });

  markdown += `
## Summary (Fill After All Reviews)

**Total Test Cases:** ${results.length}
**Cases Reviewed:** _[Count]_

**Error Rates:**
- Keyword Extraction Errors: _[Count with MAJOR_ISSUES]_ (___%)
- Qualification Extraction Errors: _[Count with MAJOR_ISSUES]_ (___%)
- Keyword Matching Errors: _[Count with MAJOR_ISSUES]_ (___%)

**Critical Issues Found:** _[Count with critical issues]_ (___%)

**Recommendation:**
- [ ] Ship as-is (error rate < 2%)
- [ ] Add confidence scores + rules (error rate 2-5%)
- [ ] Add sampling judge (error rate 5-10%)
- [ ] Add conditional judge (error rate 10-20%)
- [ ] STOP - Fix extraction prompts (error rate > 20%)

**Notes:**
_[Your overall assessment and recommendations]_

---

**Reviewer Signature:** ___________________
**Date:** ___________________
`;

  fs.writeFileSync(worksheetFile, markdown);

  console.log(`✓ Review worksheet saved to: ${worksheetFile}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Open the worksheet in a markdown editor`);
  console.log(`  2. Review each test case and mark quality ratings`);
  console.log(`  3. Document specific errors found`);
  console.log(`  4. Calculate error rates in summary section`);
  console.log(`  5. Make architecture decision based on error rates\n`);
}

// ============================================================================
// MAIN
// ============================================================================

runValidation().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
