"use client";

import { HistoryIcon, MessageSquarePlusIcon, SettingsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

function PureMobileBottomNav() {
  const { toggleSidebar } = useSidebar();
  const router = useRouter();

  const handleNewChat = useCallback(() => {
    router.push("/");
    router.refresh();
  }, [router]);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border/40 bg-background/80 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <Button
        aria-label="Open sidebar"
        className="h-12 w-12 flex-col gap-0.5 rounded-xl text-muted-foreground"
        onClick={toggleSidebar}
        size="icon"
        variant="ghost"
      >
        <HistoryIcon className="size-[18px]" />
        <span className="text-[10px] leading-none font-medium">History</span>
      </Button>

      <Button
        aria-label="New chat"
        asChild
        className="h-12 w-12 flex-col gap-0.5 rounded-xl text-muted-foreground"
        onClick={handleNewChat}
        size="icon"
        variant="ghost"
      >
        <span>
          <MessageSquarePlusIcon className="size-[18px]" />
          <span className="text-[10px] leading-none font-medium">New</span>
        </span>
      </Button>

      <Button
        aria-label="Settings"
        className="h-12 w-12 flex-col gap-0.5 rounded-xl text-muted-foreground"
        onClick={() => window.dispatchEvent(new CustomEvent("open-settings"))}
        size="icon"
        variant="ghost"
      >
        <SettingsIcon className="size-[18px]" />
        <span className="text-[10px] leading-none font-medium">Settings</span>
      </Button>
    </nav>
  );
}

export const MobileBottomNav = memo(PureMobileBottomNav);
