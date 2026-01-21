/**
 * Skill Expansion Mappings for ATS Keyword Matching
 *
 * Story 5.4: Skills Expansion Suggestions
 *
 * Provides skill expansion mappings to help ATS systems match more specific keywords.
 * Example: "Python" → "Python (pandas, NumPy, scikit-learn, TensorFlow, Django, FastAPI)"
 */

export const SKILL_EXPANSION_MAPPINGS = {
  // Programming Languages
  python: {
    family: "Python",
    expandTo: "Python (pandas, NumPy, scikit-learn, TensorFlow, Django, FastAPI)",
    categories: ["data-science", "backend", "ml"],
    relatedSkills: ["NumPy", "pandas", "Django", "FastAPI", "scikit-learn", "TensorFlow"],
  },
  javascript: {
    family: "JavaScript",
    expandTo: "JavaScript (React, Node.js, Express, Vue.js)",
    categories: ["frontend", "backend"],
    relatedSkills: ["React", "Node.js", "Express", "Vue.js"],
  },
  java: {
    family: "Java",
    expandTo: "Java (Spring, Spring Boot, Maven, JUnit)",
    categories: ["backend"],
    relatedSkills: ["Spring", "Spring Boot", "Maven", "JUnit"],
  },
  csharp: {
    family: "C#",
    expandTo: "C# (.NET, ASP.NET Core, Entity Framework)",
    categories: ["backend"],
    relatedSkills: [".NET", "ASP.NET Core", "Entity Framework"],
  },
  typescript: {
    family: "TypeScript",
    expandTo: "TypeScript (React, Next.js, Express, NestJS)",
    categories: ["frontend", "backend"],
    relatedSkills: ["React", "Next.js", "Express", "NestJS"],
  },
  golang: {
    family: "Go",
    expandTo: "Go (Gin, gRPC, Docker)",
    categories: ["backend", "devops"],
    relatedSkills: ["Gin", "gRPC", "Docker"],
  },
  rust: {
    family: "Rust",
    expandTo: "Rust (Tokio, Actix, WebAssembly)",
    categories: ["backend", "systems"],
    relatedSkills: ["Tokio", "Actix", "WebAssembly"],
  },

  // Frontend Frameworks
  react: {
    family: "React",
    expandTo: "React (Redux, React Router, Next.js, Material-UI)",
    categories: ["frontend"],
    relatedSkills: ["Redux", "React Router", "Next.js", "Material-UI"],
  },
  vue: {
    family: "Vue.js",
    expandTo: "Vue.js (Vuex, Vue Router, Nuxt.js)",
    categories: ["frontend"],
    relatedSkills: ["Vuex", "Vue Router", "Nuxt.js"],
  },
  angular: {
    family: "Angular",
    expandTo: "Angular (RxJS, TypeScript, Material)",
    categories: ["frontend"],
    relatedSkills: ["RxJS", "TypeScript", "Angular Material"],
  },

  // Backend Frameworks
  django: {
    family: "Django",
    expandTo: "Django (Django REST Framework, Celery, PostgreSQL)",
    categories: ["backend"],
    relatedSkills: ["Django REST Framework", "Celery", "PostgreSQL"],
  },
  spring: {
    family: "Spring",
    expandTo: "Spring (Spring Boot, Spring Security, Spring Data)",
    categories: ["backend"],
    relatedSkills: ["Spring Boot", "Spring Security", "Spring Data"],
  },
  express: {
    family: "Express",
    expandTo: "Express (Node.js, MongoDB, JWT, REST APIs)",
    categories: ["backend"],
    relatedSkills: ["Node.js", "MongoDB", "JWT"],
  },

  // Databases
  sql: {
    family: "SQL",
    expandTo: "SQL (PostgreSQL, MySQL, T-SQL, Query Optimization)",
    categories: ["database"],
    relatedSkills: ["PostgreSQL", "MySQL", "Database Design"],
  },
  mongodb: {
    family: "MongoDB",
    expandTo: "MongoDB (Mongoose, Aggregation, NoSQL Design)",
    categories: ["database"],
    relatedSkills: ["Mongoose", "NoSQL Design", "Document Databases"],
  },
  postgres: {
    family: "PostgreSQL",
    expandTo: "PostgreSQL (Advanced Queries, Indexing, Replication)",
    categories: ["database"],
    relatedSkills: ["SQL", "Query Optimization", "Database Design"],
  },

  // Cloud & DevOps
  aws: {
    family: "AWS",
    expandTo: "AWS (EC2, S3, Lambda, RDS, CloudFront)",
    categories: ["cloud", "devops"],
    relatedSkills: ["EC2", "S3", "Lambda", "RDS"],
  },
  gcp: {
    family: "Google Cloud",
    expandTo: "Google Cloud (Compute Engine, Cloud Storage, BigQuery)",
    categories: ["cloud"],
    relatedSkills: ["Compute Engine", "Cloud Storage", "BigQuery"],
  },
  azure: {
    family: "Azure",
    expandTo: "Azure (App Service, Azure SQL, Azure DevOps)",
    categories: ["cloud"],
    relatedSkills: ["App Service", "Azure SQL", "Azure DevOps"],
  },
  docker: {
    family: "Docker",
    expandTo: "Docker (Docker Compose, Container Orchestration, Kubernetes)",
    categories: ["devops"],
    relatedSkills: ["Docker Compose", "Kubernetes", "Container Registries"],
  },
  kubernetes: {
    family: "Kubernetes",
    expandTo: "Kubernetes (Helm, Docker, Microservices, Orchestration)",
    categories: ["devops"],
    relatedSkills: ["Helm", "Docker", "Microservices"],
  },

  // Data & Analytics
  datascience: {
    family: "Data Science",
    expandTo: "Data Science (Python, R, Machine Learning, Statistics)",
    categories: ["data-science"],
    relatedSkills: ["Python", "R", "Machine Learning", "Statistics"],
  },
  machinelearning: {
    family: "Machine Learning",
    expandTo: "Machine Learning (TensorFlow, PyTorch, Scikit-learn, NLP)",
    categories: ["ml"],
    relatedSkills: ["TensorFlow", "PyTorch", "Scikit-learn"],
  },
  tensorflow: {
    family: "TensorFlow",
    expandTo: "TensorFlow (Keras, Deep Learning, Computer Vision)",
    categories: ["ml"],
    relatedSkills: ["Keras", "Deep Learning", "Computer Vision"],
  },

  // General
  git: {
    family: "Git",
    expandTo: "Git (GitHub, GitLab, Version Control, CI/CD)",
    categories: ["devtools"],
    relatedSkills: ["GitHub", "GitLab", "GitHub Actions"],
  },
  rest: {
    family: "REST APIs",
    expandTo: "REST APIs (HTTP, JSON, API Design, OpenAPI)",
    categories: ["backend"],
    relatedSkills: ["HTTP", "JSON", "API Design"],
  },
  graphql: {
    family: "GraphQL",
    expandTo: "GraphQL (Apollo, GraphQL Schema, Resolvers, Subscriptions)",
    categories: ["backend"],
    relatedSkills: ["Apollo", "GraphQL Schema", "Resolvers"],
  },
  nextjs: {
    family: "Next.js",
    expandTo: "Next.js (SSR, SSG, App Router, Server Components)",
    categories: ["frontend", "fullstack"],
    relatedSkills: ["React", "Server Components", "SSR", "SSG"],
  },
  nestjs: {
    family: "NestJS",
    expandTo: "NestJS (TypeScript, Microservices, GraphQL, TypeORM)",
    categories: ["backend"],
    relatedSkills: ["TypeScript", "Microservices", "TypeORM"],
  },
  redis: {
    family: "Redis",
    expandTo: "Redis (Caching, Pub/Sub, Session Storage, Rate Limiting)",
    categories: ["database"],
    relatedSkills: ["Caching", "Session Management", "Message Queue"],
  },
} as const;

export type SkillExpansion = (typeof SKILL_EXPANSION_MAPPINGS)[keyof typeof SKILL_EXPANSION_MAPPINGS];

/**
 * Find skill expansion mapping by original skill name (case-insensitive)
 */
export function findSkillExpansion(skill: string): SkillExpansion | null {
  const normalized = skill.toLowerCase().replace(/\s+/g, "");

  for (const [key, expansion] of Object.entries(SKILL_EXPANSION_MAPPINGS)) {
    if (key === normalized) {
      return expansion;
    }
    // Also check against the family name
    if (expansion.family.toLowerCase().replace(/\s+/g, "") === normalized) {
      return expansion;
    }
  }

  return null;
}

/**
 * Get all expandable skills (returns list of skill names that can be expanded)
 */
export function getExpandableSkills(): string[] {
  return Object.values(SKILL_EXPANSION_MAPPINGS).map((e) => e.family);
}

/**
 * Check if a skill can be expanded
 */
export function isExpandableSkill(skill: string): boolean {
  return findSkillExpansion(skill) !== null;
}

/**
 * Filter skills that can be expanded
 */
export function filterExpandableSkills(skills: string[]): string[] {
  return skills.filter(isExpandableSkill);
}
