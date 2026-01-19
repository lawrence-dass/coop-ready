"use client";

import { Button } from "@/components/ui/button";
import { useLogout } from "@/lib/hooks/use-logout";

export function LogoutButton() {
  const { handleLogout, isPending } = useLogout();

  return (
    <Button
      data-testid="logout-button"
      onClick={handleLogout}
      disabled={isPending}
    >
      {isPending ? "Logging out..." : "Logout"}
    </Button>
  );
}
