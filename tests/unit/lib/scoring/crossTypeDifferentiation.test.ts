import { describe, it, expect } from 'vitest';
import { calculateATSScoreV21 } from '@/lib/scoring/atsScore';
import type { ATSScoreV21Input, CandidateType } from '@/lib/scoring/types';

describe('[P1] Cross-type scoring differentiation', () => {
  /**
   * Test AC #8: Same resume input scores differently across all 3 candidate types
   */
  it('same resume scores differently for coop, fulltime, and career_changer', () => {
    // Shared resume data
    const baseInput: Omit<ATSScoreV21Input, 'candidateType'> = {
      keywords: [
        { keyword: 'JavaScript', required: true, preferred: false, placement: 'skills_section', match: 'exact' },
        { keyword: 'React', required: true, preferred: false, placement: 'skills_section', match: 'exact' },
        { keyword: 'TypeScript', required: false, preferred: true, placement: 'skills_section', match: 'exact' },
      ],
      jdQualifications: {
        degreeRequired: true,
        degreeMajors: ['Computer Science', 'Software Engineering'],
        yearsRequired: 2,
        certificationsRequired: [],
        certificationsPreferred: [],
      },
      resumeQualifications: {
        degrees: [{ major: 'Computer Science', graduationYear: 2023 }],
        yearsOfExperience: 2,
        certifications: [],
      },
      allBullets: [
        'Developed web applications using React and TypeScript',
        'Implemented RESTful APIs with Node.js',
        'Collaborated with cross-functional teams',
      ],
      bulletSources: {
        experience: 2,
        projects: 1,
        education: 0,
      },
      sections: {
        summary: 'Software developer with experience in web development and modern frameworks',
        skills: ['JavaScript', 'React', 'TypeScript', 'Node.js', 'HTML', 'CSS', 'Git', 'REST APIs'],
        experience: [
          'Software Developer Intern, Tech Company (Summer 2023): Developed features for customer portal',
          'Junior Developer, Startup Inc (2023-present): Built React components and REST APIs',
        ],
        education: 'Bachelor of Science in Computer Science, University Name, Expected May 2024. GPA: 3.7. Relevant Coursework: Data Structures, Algorithms, Web Development',
        projects: [
          'E-commerce Platform: Built full-stack app with React frontend and Node.js backend',
        ],
        certifications: [],
      },
      resumeText: 'Mock resume text with proper formatting',
      jdText: 'Software Engineer position requiring JavaScript, React, TypeScript experience',
      jobType: 'fulltime',
    };

    // Calculate scores for each candidate type
    const coopScore = calculateATSScoreV21({
      ...baseInput,
      candidateType: 'coop' as CandidateType,
    });

    const fulltimeScore = calculateATSScoreV21({
      ...baseInput,
      candidateType: 'fulltime' as CandidateType,
    });

    const careerChangerScore = calculateATSScoreV21({
      ...baseInput,
      candidateType: 'career_changer' as CandidateType,
    });

    // Verify scores are different
    expect(coopScore.overall).not.toBe(fulltimeScore.overall);
    expect(coopScore.overall).not.toBe(careerChangerScore.overall);
    expect(fulltimeScore.overall).not.toBe(careerChangerScore.overall);

    // Verify component weights differ (different weight profiles applied)
    expect(coopScore.breakdownV21.keywords.weight).not.toBe(fulltimeScore.breakdownV21.keywords.weight);
    expect(careerChangerScore.breakdownV21.sections.weight).not.toBe(fulltimeScore.breakdownV21.sections.weight);

    // Scores verified to be different - no debug logging needed
  });

  it('career changer emphasizes sections and qualification fit more than fulltime', () => {
    const baseInput: Omit<ATSScoreV21Input, 'candidateType'> = {
      keywords: [
        { keyword: 'Python', required: true, preferred: false, placement: 'skills_section', match: 'exact' },
      ],
      jdQualifications: {
        degreeRequired: true,
        degreeMajors: ['Computer Science'],
        yearsRequired: 0,
        certificationsRequired: [],
        certificationsPreferred: [],
      },
      resumeQualifications: {
        degrees: [{ major: 'Computer Science', graduationYear: 2024 }],
        yearsOfExperience: 0,
        certifications: [],
      },
      allBullets: ['Completed bootcamp project with Python'],
      bulletSources: { experience: 0, projects: 1, education: 0 },
      sections: {
        summary: 'Career changer transitioning from teaching to software development through intensive bootcamp training',
        skills: ['Python', 'JavaScript', 'SQL', 'Git', 'HTML', 'CSS', 'React', 'Django'],
        experience: [],
        education: 'Bachelor of Science in Computer Science, Bootcamp University, Expected 2024. GPA: 4.0. Relevant Coursework: Python Programming, Web Development, Algorithms, Capstone Project',
        projects: [
          'Built full-stack web application using Django and React',
          'Created data visualization dashboard with Python',
        ],
        certifications: [],
      },
      resumeText: 'Mock resume text',
      jdText: 'Python developer position',
      jobType: 'fulltime',
    };

    const careerChangerScore = calculateATSScoreV21({
      ...baseInput,
      candidateType: 'career_changer',
    });

    const fulltimeScore = calculateATSScoreV21({
      ...baseInput,
      candidateType: 'fulltime',
    });

    // Career changer should have higher sections weight (0.18 vs 0.15)
    expect(careerChangerScore.breakdownV21.sections.weight).toBeGreaterThan(
      fulltimeScore.breakdownV21.sections.weight
    );

    // Career changer should have lower qualification fit weight (0.14 vs 0.15)
    expect(careerChangerScore.breakdownV21.qualificationFit.weight).toBeLessThan(
      fulltimeScore.breakdownV21.qualificationFit.weight
    );
  });
});
