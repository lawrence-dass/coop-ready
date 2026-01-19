"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/actions/auth";
import { toast } from "sonner";

/**
 * Hook for handling user logout with loading state and error handling.
 *
 * @returns Object containing:
 * - `handleLogout`: Function to trigger logout
 * - `isPending`: Boolean indicating if logout is in progress
 *
 * @example
 * ```tsx
 * const { handleLogout, isPending } = useLogout();
 *
 * <Button onClick={handleLogout} disabled={isPending}>
 *   {isPending ? "Logging out..." : "Logout"}
 * </Button>
 * ```
 */
export function useLogout() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      const { error } = await signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      router.refresh(); // Clear client-side cache
      router.push("/auth/login");
    });
  };

  return { handleLogout, isPending };
}
