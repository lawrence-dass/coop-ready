/**
 * Tests for suggestion-types utilities
 */

import {
  SUGGESTION_TYPE_META,
  RESUME_SECTIONS,
  SECTION_DISPLAY_NAMES,
  SECTION_ICONS,
  ALL_SUGGESTION_TYPES,
} from "@/lib/utils/suggestion-types";

describe("Suggestion Types Utilities", () => {
  describe("SUGGESTION_TYPE_META", () => {
    it("should have all required suggestion types", () => {
      const requiredTypes = [
        "bullet_rewrite",
        "skill_mapping",
        "action_verb",
        "quantification",
        "skill_expansion",
        "format",
        "removal",
      ];
      requiredTypes.forEach((type) => {
        expect(SUGGESTION_TYPE_META).toHaveProperty(type);
      });
    });

    it("should have complete metadata for each suggestion type", () => {
      Object.entries(SUGGESTION_TYPE_META).forEach(([key, meta]) => {
        expect(meta).toHaveProperty("label");
        expect(meta).toHaveProperty("color");
        expect(meta).toHaveProperty("badge");
        expect(meta).toHaveProperty("icon");
        expect(meta).toHaveProperty("description");

        expect(typeof meta.label).toBe("string");
        expect(typeof meta.color).toBe("string");
        expect(typeof meta.badge).toBe("string");
        expect(typeof meta.icon).toBe("string");
        expect(typeof meta.description).toBe("string");
      });
    });

    it("should have distinct badges for each type", () => {
      const badges = Object.values(SUGGESTION_TYPE_META).map((m) => m.badge);
      const uniqueBadges = new Set(badges);
      expect(uniqueBadges.size).toBe(badges.length);
    });
  });

  describe("RESUME_SECTIONS", () => {
    it("should have all required sections", () => {
      const requiredSections = [
        "experience",
        "education",
        "skills",
        "projects",
        "format",
      ];
      expect(RESUME_SECTIONS).toEqual(requiredSections);
    });

    it("should have display names for all sections", () => {
      RESUME_SECTIONS.forEach((section) => {
        expect(SECTION_DISPLAY_NAMES).toHaveProperty(section);
        expect(typeof SECTION_DISPLAY_NAMES[section]).toBe("string");
      });
    });

    it("should have icons for all sections", () => {
      RESUME_SECTIONS.forEach((section) => {
        expect(SECTION_ICONS).toHaveProperty(section);
        expect(typeof SECTION_ICONS[section]).toBe("string");
      });
    });
  });

  describe("SECTION_DISPLAY_NAMES", () => {
    it("should have human-readable names", () => {
      expect(SECTION_DISPLAY_NAMES.experience).toBe("Experience");
      expect(SECTION_DISPLAY_NAMES.education).toBe("Education");
      expect(SECTION_DISPLAY_NAMES.skills).toBe("Skills");
      expect(SECTION_DISPLAY_NAMES.projects).toBe("Projects");
      expect(SECTION_DISPLAY_NAMES.format).toBe("Format & Content");
    });
  });

  describe("SECTION_ICONS", () => {
    it("should have valid icon names", () => {
      const validIcons = [
        "Briefcase",
        "BookOpen",
        "Code",
        "Folder",
        "FileText",
      ];
      Object.values(SECTION_ICONS).forEach((icon) => {
        expect(validIcons).toContain(icon);
      });
    });
  });

  describe("ALL_SUGGESTION_TYPES", () => {
    it("should have all suggestion types", () => {
      expect(ALL_SUGGESTION_TYPES.length).toBe(7);
      expect(ALL_SUGGESTION_TYPES).toContain("bullet_rewrite");
      expect(ALL_SUGGESTION_TYPES).toContain("skill_mapping");
      expect(ALL_SUGGESTION_TYPES).toContain("action_verb");
      expect(ALL_SUGGESTION_TYPES).toContain("quantification");
      expect(ALL_SUGGESTION_TYPES).toContain("skill_expansion");
      expect(ALL_SUGGESTION_TYPES).toContain("format");
      expect(ALL_SUGGESTION_TYPES).toContain("removal");
    });
  });
});
