/**
 * Sample Resume Fixtures for Testing
 * Used by E2E and unit tests for resume parsing validation
 */

export const SAMPLE_RESUMES = {
  /**
   * Complete well-formatted resume with all sections
   */
  standardResume: `
John Doe
(555) 123-4567
john@example.com
linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Experienced full-stack developer with 5+ years of expertise in building scalable web applications using modern technologies. Strong background in cloud architecture and team leadership.

PROFESSIONAL EXPERIENCE

Tech Corp
Senior Software Developer
June 2021 - Present
- Led development team of 5 engineers on microservices migration
- Implemented distributed caching architecture reducing API response time by 40%
- Mentored 3 junior developers resulting in 2 promotions
- Established CI/CD pipeline using Jenkins and Docker

StartupXYZ
Full Stack Developer
January 2020 - May 2021
- Built React.js frontend for e-commerce platform serving 100k+ users
- Developed REST API endpoints using Node.js and Express
- Implemented PostgreSQL database schema and optimization queries
- Collaborated with design team to implement responsive UI

Early Tech Inc
Junior Developer
June 2018 - December 2019
- Developed features for internal tools using Python and Django
- Wrote unit tests achieving 85% code coverage
- Fixed critical bugs in production environment

EDUCATION

State University
B.S. Computer Science
2018
GPA: 3.8/4.0

Technical Academy
Machine Learning Certificate
2020

TECHNICAL SKILLS
Programming Languages: Python, JavaScript, Java, SQL
Web Frameworks: React, Node.js, Django, Spring Boot
Databases: PostgreSQL, MongoDB, Redis
DevOps & Tools: Docker, Kubernetes, AWS, Git, Jenkins
Cloud Platforms: AWS (EC2, S3, Lambda), Google Cloud Platform

SOFT SKILLS
Leadership, Team Management, Project Coordination
Communication, Mentoring, Strategic Planning
Problem-Solving, Critical Thinking, Agile Methodology

PROJECTS

E-Commerce Platform (Personal Project, 2021)
Full-stack MERN application with Stripe payment integration, user authentication, and admin dashboard. Deployed on AWS with auto-scaling.

Portfolio Website (2022)
Personal portfolio built with Next.js and Tailwind CSS showcasing projects and technical writing.

CERTIFICATIONS
AWS Solutions Architect Associate
Google Cloud Professional Data Engineer

LANGUAGES
English (Native), Spanish (Fluent)
  `,

  /**
   * Minimal resume with basic information
   */
  minimalResume: `
Jane Smith
jane@example.com
(555) 987-6543

Experience
Tech Company, Developer, 2021-Present
Startup Inc, Junior Developer, 2020-2021

Education
University Name
B.S. Computer Science, 2020

Skills
Python, JavaScript, React
  `,

  /**
   * Resume with non-standard sections
   */
  nonStandardResume: `
John Developer
john@dev.com
(555) 111-1111

Summary
Senior software architect with expertise in distributed systems

Work History
Big Tech Corp, Principal Engineer, 2019-Present
- Led architectural decisions for microservices platform

Awards & Recognition
- Innovation Award 2023
- Engineering Excellence 2022

Certifications
AWS Solutions Architect Professional
Kubernetes Certified Application Developer

Volunteer Work
Open Source Maintainer, Popular GitHub Project
Technical Mentor, Code School Non-Profit

Publications
"Building Scalable Systems" - Tech Magazine, 2023
"Microservices Best Practices" - Conference Talk, 2022

Languages & Tools
Python, Go, Rust, Kubernetes, Terraform

Interests
Machine Learning, Cloud Architecture, Open Source
  `,

  /**
   * Resume with various date formats and experiences
   */
  variableDateResume: `
Robert Johnson
robert@email.com
(555) 222-2222

Professional Experience

Tech Solutions Inc
Senior Backend Engineer
06/2021 - Present
- Architected microservices platform
- Managed team of 4 engineers

StartupXYZ
Full Stack Developer
Jan 2020 - May 2021
- Built web applications
- Implemented APIs

Early Career
Junior Developer
2018 - 2019
- Learned fundamentals

Education

Stanford University
MS Computer Science
2018

State University
BS Computer Science
2016

Skills
Python, JavaScript, Java, Go, Kubernetes, Docker, PostgreSQL, MongoDB
AWS, Azure, Leadership, Communication
  `,

  /**
   * Resume with GPA and academic honors
   */
  academicResume: `
Alice Chen
alice@example.com
(555) 333-3333

Summary
Full-stack developer with strong academic background and practical experience

Experience
Tech Innovations, Software Engineer, 2022-Present
- Developing cloud-native applications

Tech Startup, Developer, 2021-2022
- Built internal tools

Education

Massachusetts Institute of Technology (MIT)
B.S. Computer Science
2021
GPA: 3.9/4.0
Honors: Summa Cum Laude

Online Learning Platform
Machine Learning Specialization Certificate
2021

Skills
Python, Machine Learning, TensorFlow, PyTorch
JavaScript, React, Node.js, AWS
Team Collaboration, Technical Writing, Mentoring
  `,

  /**
   * Resume with complex experience section
   */
  complexExperienceResume: `
Michael Thompson
michael@email.com
(555) 444-4444

Professional Experience

Tech Corp International
Senior Architect (2022-Present)
- Led architecture for $10M+ transformation project
- Managed team of 8 across 3 time zones
- Achieved 99.99% uptime

Senior Engineer (2020-2022)
- Implemented microservices platform
- Reduced costs by 30%

Lead Developer (2018-2020)
- Built team from scratch
- Delivered 20+ features

StartupXYZ Inc.
Full Stack Developer, 2016-2018
- Created MVP in 6 weeks
- Scaled to 100k users

Education

University of California, Berkeley
BS Engineering, 2016

Skills
Leadership, Architecture, Cloud Design
Python, Java, Go, Kubernetes, AWS
  `,

  /**
   * Resume with soft skills emphasis
   */
  softSkillsResume: `
Sarah Williams
sarah@example.com
(555) 555-5555

Professional Summary
Results-oriented leader with 10 years of experience managing cross-functional teams and driving organizational growth

Experience
Global Tech Company
Director of Engineering
2021-Present
- Transformed engineering culture
- Built and mentored high-performing teams
- Improved delivery speed by 60%

Tech Startup
Engineering Manager
2018-2021
- Hired and onboarded 15 engineers
- Implemented agile processes
- Mentored junior developers

Consultant
Technical Leader
2015-2018
- Led transformation projects
- Trained teams on best practices

Education
University, B.S. Computer Science, 2014

Key Skills
Leadership and Team Management
Strategic Planning and Vision Setting
Cross-functional Collaboration
Mentoring and Career Development
Communication and Presentation
Agile and Scrum Methodology
Project Management
  `,

  /**
   * Resume with incomplete sections (for error handling)
   */
  incompleteResume: `
John Doe
john@example.com

Experience
Worked at various companies

Education

Skills
Python, JavaScript
  `,

  /**
   * Resume with unusual formatting
   */
  unusualFormatResume: `
JOHN | SENIOR DEVELOPER | john@mail.com | (555) 666-6666

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
CAREER OVERVIEW
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* 8+ years software development
* Full stack expertise
* Cloud architecture

[WORK HISTORY]
>>> Tech Corp | 2021-Now | Senior Developer
    - Led team initiatives
    - Architecture design

>>> Startup Inc | 2019-2021 | Developer
    - Feature development
    - Bug fixes

[EDUCATION]
> University Name | BS Computer Science | 2019

[CAPABILITIES]
:: Python, JavaScript, React, Node.js
:: Docker, Kubernetes, AWS
:: Problem-solving, Leadership
  `,

  /**
   * Resume with multiple degrees
   */
  multipleDegreesResume: `
Dr. Jane Smith
jane@example.com
(555) 777-7777

Professional Experience
Research University, Professor, 2022-Present
Tech Company, Senior Researcher, 2019-2022

Education
University A
Ph.D. Computer Science
2019

University B
M.S. Computer Engineering
2015

University C
B.S. Computer Science
2013

Skills
Research, Machine Learning, Python, TensorFlow, Academic Writing
  `,

  /**
   * Resume with empty/minimal sections
   */
  sparseResume: `
Name: Test User
Email: test@example.com
Phone: 555-999-9999

Background: Software Developer

Experience
Company Name - Position - Year

Education
School Name - Degree - Year

Abilities
Coding, Testing
  `,
};

/**
 * Expected parsed output for standardResume
 * Used for validation tests (use with expect matchers in tests)
 */
export const EXPECTED_PARSED_OUTPUT = {
  contact: "John Doe",
  summary: "full-stack developer",
  experienceCompany: "Tech Corp",
  experienceTitle: "Senior",
  experienceDates: "2021",
  educationInstitution: "State University",
  educationDegree: "B.S.",
  skillCategory: /technical|soft/,
};

/**
 * Helper to create test resume with custom content
 */
export function createTestResume(overrides: Record<string, string>): string {
  let resume = SAMPLE_RESUMES.standardResume;

  Object.entries(overrides).forEach(([section, content]) => {
    // Simple string replacement for testing
    resume = resume.replace(`${section.toUpperCase()}\n`, `${section.toUpperCase()}\n${content}\n`);
  });

  return resume;
}

/**
 * Malformed resumes for error handling tests
 */
export const MALFORMED_RESUMES = {
  emptyString: "",

  onlyNewlines: "\n\n\n",

  noStructure: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",

  corruptedEncoding: "\ufffd\ufffd\ufffd Invalid characters",

  veryLongUnstructured: Array(1000)
    .fill("Lorem ipsum dolor sit amet")
    .join(" "),
};

/**
 * Extract formatted text (simulating PDF/DOCX extraction)
 */
export const EXTRACTED_RESUME_TEXT = {
  fromPDF: `
John Doe
(555) 123-4567
john@example.com

Professional Summary
Experienced developer

Professional Experience

Tech Corp
Senior Developer
June 2021 - Present
Led team of engineers

Education

State University
B.S. Computer Science
2019
GPA: 3.8

Skills
Python, JavaScript, React
Leadership, Communication
  `,

  fromDOCX: `
John Doe | (555) 123-4567 | john@example.com

Professional Summary
Experienced developer

Professional Experience
Tech Corp | Senior Developer | June 2021 - Present
- Led team of engineers

Education
State University | B.S. Computer Science | 2019

Skills
Python, JavaScript, React
Leadership, Communication
  `,

  withFormatting: `
\t\tJohn Doe
\t\t(555) 123-4567
\t\tjohn@example.com

PROFESSIONAL SUMMARY
\t\tExperienced developer with 5+ years experience

PROFESSIONAL EXPERIENCE
\t\tTech Corp
\t\tSenior Developer
\t\tJune 2021 - Present
\t\t- Led team of engineers
\t\t- Implemented features

EDUCATION
\t\tState University
\t\tB.S. Computer Science
\t\t2019

SKILLS
\t\tPython, JavaScript, React
\t\tLeadership, Communication
  `,
};
