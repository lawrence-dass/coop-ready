/**
 * Suggestion Type Metadata and Constants
 * Defines all suggestion types with their display properties
 */

export const SUGGESTION_TYPE_META = {
  bullet_rewrite: {
    label: "Bullet Rewrite",
    color: "bg-blue-100 text-blue-900 border-blue-300",
    badge: "bg-blue-500",
    icon: "Edit3",
    description: "Improved wording and impact",
  },
  skill_mapping: {
    label: "Skill Mapping",
    color: "bg-purple-100 text-purple-900 border-purple-300",
    badge: "bg-purple-500",
    icon: "Link2",
    description: "Transferable skills mapped to tech",
  },
  action_verb: {
    label: "Action Verb",
    color: "bg-orange-100 text-orange-900 border-orange-300",
    badge: "bg-orange-500",
    icon: "Zap",
    description: "Stronger action verb",
  },
  quantification: {
    label: "Quantification",
    color: "bg-green-100 text-green-900 border-green-300",
    badge: "bg-green-500",
    icon: "BarChart3",
    description: "Add metrics and numbers",
  },
  skill_expansion: {
    label: "Skill Expansion",
    color: "bg-teal-100 text-teal-900 border-teal-300",
    badge: "bg-teal-500",
    icon: "Expand",
    description: "Expand skill with specific tools",
  },
  format: {
    label: "Format",
    color: "bg-yellow-100 text-yellow-900 border-yellow-300",
    badge: "bg-yellow-500",
    icon: "Layout",
    description: "Formatting consistency",
  },
  removal: {
    label: "Removal",
    color: "bg-red-100 text-red-900 border-red-300",
    badge: "bg-red-500",
    icon: "Trash2",
    description: "Content to remove",
  },
} as const;

export type SuggestionType = keyof typeof SUGGESTION_TYPE_META;

export const RESUME_SECTIONS = [
  "experience",
  "education",
  "skills",
  "projects",
  "format",
] as const;

export type ResumeSection = (typeof RESUME_SECTIONS)[number];

export const SECTION_DISPLAY_NAMES: Record<ResumeSection, string> = {
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  format: "Format & Content",
};

export const SECTION_ICONS: Record<ResumeSection, string> = {
  experience: "Briefcase",
  education: "BookOpen",
  skills: "Code",
  projects: "Folder",
  format: "FileText",
};

export const ALL_SUGGESTION_TYPES = Object.keys(
  SUGGESTION_TYPE_META
) as SuggestionType[];

export interface DisplaySuggestion {
  id: string;
  section: string;
  itemIndex: number;
  originalText: string;
  suggestedText: string;
  suggestionType: string;
  reasoning: string;
  status: string;
}
