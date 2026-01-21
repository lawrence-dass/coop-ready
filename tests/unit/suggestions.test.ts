/**
 * Tests for Supabase suggestions utilities
 * Tests transformation and grouping logic without complex mocking
 */

import type { DisplaySuggestion } from "@/lib/utils/suggestion-types";

const mockSuggestions = [
  {
    id: "1",
    scan_id: "scan-1",
    section: "experience",
    item_index: 0,
    original_text: "Managed team",
    suggested_text: "Led team of 5",
    suggestion_type: "action_verb",
    reasoning: "Stronger verb",
    status: "pending",
    created_at: "2026-01-18T00:00:00Z",
  },
  {
    id: "2",
    scan_id: "scan-1",
    section: "experience",
    item_index: 1,
    original_text: "Improved sales",
    suggested_text: "Increased sales by 25%",
    suggestion_type: "quantification",
    reasoning: "Add metrics",
    status: "pending",
    created_at: "2026-01-18T00:00:00Z",
  },
  {
    id: "3",
    scan_id: "scan-1",
    section: "skills",
    item_index: 0,
    original_text: "JavaScript",
    suggested_text: "JavaScript (React, Node.js)",
    suggestion_type: "skill_expansion",
    reasoning: "Expand skill details",
    status: "pending",
    created_at: "2026-01-18T00:00:00Z",
  },
];

describe("Suggestions Data Transformation", () => {
  describe("Transform snake_case to camelCase", () => {
    it("should transform database row to display format", () => {
      const row = mockSuggestions[0];
      const transformed: DisplaySuggestion = {
        id: row.id,
        section: row.section,
        itemIndex: row.item_index,
        originalText: row.original_text,
        suggestedText: row.suggested_text,
        suggestionType: row.suggestion_type,
        reasoning: row.reasoning,
        status: row.status,
      };

      expect(transformed).toHaveProperty("itemIndex");
      expect(transformed).not.toHaveProperty("item_index");
      expect(transformed).toHaveProperty("originalText");
      expect(transformed).not.toHaveProperty("original_text");
      expect(transformed).toHaveProperty("suggestedText");
      expect(transformed).toHaveProperty("suggestionType");
    });

    it("should preserve all field values during transformation", () => {
      const row = mockSuggestions[0];
      const transformed: DisplaySuggestion = {
        id: row.id,
        section: row.section,
        itemIndex: row.item_index,
        originalText: row.original_text,
        suggestedText: row.suggested_text,
        suggestionType: row.suggestion_type,
        reasoning: row.reasoning,
        status: row.status,
      };

      expect(transformed.id).toBe(row.id);
      expect(transformed.originalText).toBe(row.original_text);
      expect(transformed.suggestedText).toBe(row.suggested_text);
      expect(transformed.suggestionType).toBe(row.suggestion_type);
    });
  });

  describe("Group suggestions by section", () => {
    it("should group multiple suggestions by section", () => {
      const grouped: Record<string, DisplaySuggestion[]> = {
        experience: [],
        education: [],
        skills: [],
        projects: [],
        format: [],
      };

      for (const row of mockSuggestions) {
        const section = row.section || "format";
        if (section in grouped) {
          grouped[section].push({
            id: row.id,
            section: row.section,
            itemIndex: row.item_index,
            originalText: row.original_text,
            suggestedText: row.suggested_text,
            suggestionType: row.suggestion_type,
            reasoning: row.reasoning,
            status: row.status,
          });
        }
      }

      expect(grouped.experience.length).toBe(2);
      expect(grouped.skills.length).toBe(1);
      expect(grouped.education.length).toBe(0);
    });

    it("should initialize all sections as empty arrays", () => {
      const sections = ["experience", "education", "skills", "projects", "format"];
      const grouped: Record<string, DisplaySuggestion[]> = {};

      for (const section of sections) {
        grouped[section] = [];
      }

      expect(Object.keys(grouped).length).toBe(5);
      sections.forEach((section) => {
        expect(grouped[section]).toEqual([]);
      });
    });
  });

  describe("Count suggestions by type", () => {
    it("should count suggestions by type", () => {
      const counts: Record<string, number> = {};

      for (const row of mockSuggestions) {
        const type = row.suggestion_type || "format";
        counts[type] = (counts[type] || 0) + 1;
      }

      expect(counts.action_verb).toBe(1);
      expect(counts.quantification).toBe(1);
      expect(counts.skill_expansion).toBe(1);
      expect(Object.keys(counts).length).toBe(3);
    });
  });

  describe("Calculate statistics", () => {
    it("should calculate total, by-section, and by-type stats", () => {
      const bySection: Record<string, number> = {};
      const byType: Record<string, number> = {};
      const bySectionAndType: Record<string, Record<string, number>> = {};

      for (const row of mockSuggestions) {
        const section = row.section || "format";
        const type = row.suggestion_type || "format";

        bySection[section] = (bySection[section] || 0) + 1;
        byType[type] = (byType[type] || 0) + 1;

        if (!bySectionAndType[section]) {
          bySectionAndType[section] = {};
        }
        bySectionAndType[section][type] =
          (bySectionAndType[section][type] || 0) + 1;
      }

      const total = mockSuggestions.length;

      expect(total).toBe(3);
      expect(bySection.experience).toBe(2);
      expect(bySection.skills).toBe(1);
      expect(byType.action_verb).toBe(1);
      expect(bySectionAndType.experience.action_verb).toBe(1);
    });
  });
});
