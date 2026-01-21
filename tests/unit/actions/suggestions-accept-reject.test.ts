/**
 * Tests for suggestion status update server actions
 *
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */

import { describe, test, expect, jest, beforeEach } from "@jest/globals";

// Mock dependencies before importing
jest.mock("@/lib/supabase/server");

import {
  updateSuggestionStatus,
  acceptAllInSection,
  rejectAllInSection,
  getSuggestionSummary,
} from "@/actions/suggestions";

describe("Suggestion Status Update Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("updateSuggestionStatus", () => {
    describe("Input Validation", () => {
      test("rejects invalid suggestionId", async () => {
        const result = await updateSuggestionStatus({
          suggestionId: "invalid-uuid",
          scanId: "550e8400-e29b-41d4-a716-446655440000",
          status: "accepted",
        });

        expect(result.data).toBeNull();
        expect(result.error).not.toBeNull();
        expect(result.error?.code).toBe("VALIDATION_ERROR");
      });

      test("rejects invalid scanId", async () => {
        const result = await updateSuggestionStatus({
          suggestionId: "550e8400-e29b-41d4-a716-446655440001",
          scanId: "invalid-uuid",
          status: "accepted",
        });

        expect(result.data).toBeNull();
        expect(result.error?.code).toBe("VALIDATION_ERROR");
      });

      test("rejects invalid status value", async () => {
        const result = await updateSuggestionStatus({
          suggestionId: "550e8400-e29b-41d4-a716-446655440001",
          scanId: "550e8400-e29b-41d4-a716-446655440000",
          status: "invalid-status" as any,
        });

        expect(result.data).toBeNull();
        expect(result.error?.code).toBe("VALIDATION_ERROR");
      });

      test("accepts valid inputs for all status values", async () => {
        const { createClient } = await import("@/lib/supabase/server");
        const mockUpdate = jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        });

        const mockSelect = jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: { id: "scan-1", user_id: "user-1" },
            error: null,
          }),
        });

        (createClient as jest.Mock).mockResolvedValue({
          from: jest.fn((table: string) => {
            if (table === "scans") {
              return { select: mockSelect };
            }
            return { update: mockUpdate };
          }),
        });

        for (const status of ["pending", "accepted", "rejected"]) {
          const result = await updateSuggestionStatus({
            suggestionId: "550e8400-e29b-41d4-a716-446655440001",
            scanId: "550e8400-e29b-41d4-a716-446655440000",
            status: status as any,
          });

          // Should not have validation error (may have other errors in real scenario)
          if (result.error) {
            expect(result.error.code).not.toBe("VALIDATION_ERROR");
          }
        }
      });
    });
  });

  describe("acceptAllInSection", () => {
    describe("Input Validation", () => {
      test("rejects invalid scanId", async () => {
        const result = await acceptAllInSection({
          scanId: "invalid-uuid",
          section: "experience",
        });

        expect(result.data).toBeNull();
        expect(result.error?.code).toBe("VALIDATION_ERROR");
      });
    });
  });

  describe("rejectAllInSection", () => {
    describe("Input Validation", () => {
      test("rejects invalid scanId", async () => {
        const result = await rejectAllInSection({
          scanId: "invalid-uuid",
          section: "experience",
        });

        expect(result.data).toBeNull();
        expect(result.error?.code).toBe("VALIDATION_ERROR");
      });
    });
  });

  describe("getSuggestionSummary", () => {
    describe("Input Validation", () => {
      test("rejects invalid scanId", async () => {
        const result = await getSuggestionSummary("invalid-uuid");

        expect(result.data).toBeNull();
        expect(result.error?.code).toBe("VALIDATION_ERROR");
      });
    });
  });
});
