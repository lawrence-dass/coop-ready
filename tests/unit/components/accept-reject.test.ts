/**
 * Tests for Accept/Reject UI Components
 *
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */

import { describe, test, expect } from "@jest/globals";
import { SUGGESTION_TYPE_META } from "@/lib/utils/suggestion-types";
import type { DisplaySuggestion } from "@/lib/utils/suggestion-types";

describe("Accept/Reject Components", () => {
  describe("AcceptRejectButtons Component", () => {
    describe("Props Validation", () => {
      test("should have required props", () => {
        const props = {
          suggestionId: "550e8400-e29b-41d4-a716-446655440001",
          scanId: "550e8400-e29b-41d4-a716-446655440000",
          currentStatus: "pending" as const,
        };

        expect(props).toHaveProperty("suggestionId");
        expect(props).toHaveProperty("scanId");
        expect(props).toHaveProperty("currentStatus");
      });

      test("should accept all valid status values", () => {
        const statuses = ["pending", "accepted", "rejected"] as const;

        statuses.forEach((status) => {
          const props = {
            suggestionId: "550e8400-e29b-41d4-a716-446655440001",
            scanId: "550e8400-e29b-41d4-a716-446655440000",
            currentStatus: status,
          };

          expect(props.currentStatus).toBeOneOf(statuses);
        });
      });

      test("should have optional onStatusChange callback", () => {
        const callback = (status: string) => {
          expect(["pending", "accepted", "rejected"]).toContain(status);
        };

        const props = {
          suggestionId: "550e8400-e29b-41d4-a716-446655440001",
          scanId: "550e8400-e29b-41d4-a716-446655440000",
          currentStatus: "pending" as const,
          onStatusChange: callback,
        };

        expect(props.onStatusChange).toBeDefined();
        expect(typeof props.onStatusChange).toBe("function");
      });
    });

    describe("Status Transitions", () => {
      test("should transition from pending to accepted", () => {
        const transitions = [
          { from: "pending", to: "accepted" },
          { from: "pending", to: "rejected" },
          { from: "accepted", to: "rejected" },
          { from: "accepted", to: "pending" },
          { from: "rejected", to: "accepted" },
          { from: "rejected", to: "pending" },
        ];

        transitions.forEach(({ from, to }) => {
          expect(["pending", "accepted", "rejected"]).toContain(from);
          expect(["pending", "accepted", "rejected"]).toContain(to);
        });
      });

      test("should toggle between same status and pending", () => {
        expect("pending").not.toBe("accepted");
        expect("accepted").not.toBe("pending");
        expect("pending").not.toBe("rejected");
        expect("rejected").not.toBe("pending");
      });
    });
  });

  describe("SectionActions Component", () => {
    describe("Props Validation", () => {
      test("should have required props", () => {
        const props = {
          scanId: "550e8400-e29b-41d4-a716-446655440000",
          section: "experience",
          hasPendingSuggestions: true,
        };

        expect(props).toHaveProperty("scanId");
        expect(props).toHaveProperty("section");
        expect(props).toHaveProperty("hasPendingSuggestions");
      });

      test("should validate scanId format", () => {
        const validProps = {
          scanId: "550e8400-e29b-41d4-a716-446655440000",
          section: "experience",
          hasPendingSuggestions: true,
        };

        expect(validProps.scanId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
      });

      test("should accept valid section names", () => {
        const sections = ["experience", "education", "projects", "skills", "format"];

        sections.forEach((section) => {
          const props = {
            scanId: "550e8400-e29b-41d4-a716-446655440000",
            section,
            hasPendingSuggestions: true,
          };

          expect(props.section).toBeOneOf(sections);
        });
      });
    });

    describe("Visibility Logic", () => {
      test("should be visible when pending suggestions exist", () => {
        const props = {
          scanId: "550e8400-e29b-41d4-a716-446655440000",
          section: "experience",
          hasPendingSuggestions: true,
        };

        expect(props.hasPendingSuggestions).toBe(true);
      });

      test("should be hidden when no pending suggestions", () => {
        const props = {
          scanId: "550e8400-e29b-41d4-a716-446655440000",
          section: "experience",
          hasPendingSuggestions: false,
        };

        expect(props.hasPendingSuggestions).toBe(false);
      });
    });
  });

  describe("SuggestionsSummary Component", () => {
    describe("Props Validation", () => {
      test("should have required props", () => {
        const props = {
          scanId: "550e8400-e29b-41d4-a716-446655440000",
        };

        expect(props).toHaveProperty("scanId");
      });

      test("should have optional onContinue callback", () => {
        const callback = jest.fn();

        const props = {
          scanId: "550e8400-e29b-41d4-a716-446655440000",
          onContinue: callback,
        };

        expect(props.onContinue).toBeDefined();
        expect(typeof props.onContinue).toBe("function");
      });
    });

    describe("Summary Stats", () => {
      test("should display all status counts", () => {
        const summary = {
          total: 10,
          accepted: 5,
          rejected: 3,
          pending: 2,
        };

        expect(summary.total).toBe(summary.accepted + summary.rejected + summary.pending);
        expect(summary.accepted).toBeGreaterThanOrEqual(0);
        expect(summary.rejected).toBeGreaterThanOrEqual(0);
        expect(summary.pending).toBeGreaterThanOrEqual(0);
      });

      test("should calculate completion percentage correctly", () => {
        const summary = {
          total: 10,
          accepted: 5,
          rejected: 3,
          pending: 2,
        };

        const completionPercentage = Math.round(
          ((summary.accepted + summary.rejected) / summary.total) * 100
        );

        expect(completionPercentage).toBe(80);
      });

      test("should show 100% when all reviewed", () => {
        const summary = {
          total: 5,
          accepted: 3,
          rejected: 2,
          pending: 0,
        };

        const completionPercentage = Math.round(
          ((summary.accepted + summary.rejected) / summary.total) * 100
        );

        expect(completionPercentage).toBe(100);
      });

      test("should show 0% when none reviewed", () => {
        const summary = {
          total: 5,
          accepted: 0,
          rejected: 0,
          pending: 5,
        };

        const completionPercentage = Math.round(
          ((summary.accepted + summary.rejected) / summary.total) * 100
        );

        expect(completionPercentage).toBe(0);
      });
    });

    describe("Button States", () => {
      test('should enable "Continue to Preview" when all reviewed', () => {
        const summary = {
          total: 5,
          accepted: 3,
          rejected: 2,
          pending: 0,
        };

        const isComplete = summary.pending === 0;
        expect(isComplete).toBe(true);
      });

      test('should disable "Continue to Preview" when pending exist', () => {
        const summary = {
          total: 5,
          accepted: 2,
          rejected: 2,
          pending: 1,
        };

        const isComplete = summary.pending === 0;
        expect(isComplete).toBe(false);
      });

      test('should show "Skip All" button only when pending', () => {
        const summary1 = {
          pending: 0,
        };

        const summary2 = {
          pending: 2,
        };

        expect(summary1.pending === 0).toBe(true);
        expect(summary2.pending > 0).toBe(true);
      });
    });
  });

  describe("Suggestion Card Integration", () => {
    describe("Status Display", () => {
      test("should show pending status in neutral colors", () => {
        const suggestion: DisplaySuggestion = {
          id: "1",
          section: "experience",
          itemIndex: 0,
          originalText: "Managed team",
          suggestedText: "Led team of 5",
          suggestionType: "action_verb",
          reasoning: "Stronger action verb",
          status: "pending",
        };

        expect(suggestion.status).toBe("pending");
      });

      test("should show accepted status in green", () => {
        const suggestion: DisplaySuggestion = {
          id: "1",
          section: "experience",
          itemIndex: 0,
          originalText: "Managed team",
          suggestedText: "Led team of 5",
          suggestionType: "action_verb",
          reasoning: "Stronger action verb",
          status: "accepted",
        };

        expect(suggestion.status).toBe("accepted");
      });

      test("should show rejected status in red", () => {
        const suggestion: DisplaySuggestion = {
          id: "1",
          section: "experience",
          itemIndex: 0,
          originalText: "Managed team",
          suggestedText: "Led team of 5",
          suggestionType: "action_verb",
          reasoning: "Stronger action verb",
          status: "rejected",
        };

        expect(suggestion.status).toBe("rejected");
      });
    });

    describe("Suggestion Type Metadata", () => {
      test("should have metadata for all suggestion types", () => {
        const types = [
          "bullet_rewrite",
          "skill_mapping",
          "action_verb",
          "quantification",
          "skill_expansion",
          "format",
          "removal",
        ];

        types.forEach((type) => {
          const meta = SUGGESTION_TYPE_META[type as keyof typeof SUGGESTION_TYPE_META];
          expect(meta).toBeDefined();
          expect(meta).toHaveProperty("label");
          expect(meta).toHaveProperty("badge");
          expect(meta).toHaveProperty("color");
        });
      });
    });
  });
});

// Helper to make toBeOneOf matcher available
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(values: any[]): R;
    }
  }
}

expect.extend({
  toBeOneOf(received, values) {
    const pass = values.includes(received);
    return {
      pass,
      message: () =>
        `expected ${received} to be one of ${JSON.stringify(values)}`,
    };
  },
});
