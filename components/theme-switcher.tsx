"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;

  const getThemeLabel = (currentTheme: string | undefined) => {
    switch (currentTheme) {
      case "light":
        return "Light theme";
      case "dark":
        return "Dark theme";
      case "system":
        return "System theme";
      default:
        return "Theme selector";
    }
  };

  const getCurrentThemeDescription = (currentTheme: string | undefined) => {
    switch (currentTheme) {
      case "light":
        return "Currently using light theme";
      case "dark":
        return "Currently using dark theme";
      case "system":
        return "Currently using system theme";
      default:
        return "Theme not set";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size={"sm"}
          aria-label={`${getThemeLabel(theme)}. Click to change theme.`}
          aria-describedby="theme-description"
        >
          {theme === "light" ? (
            <Sun
              key="light"
              size={ICON_SIZE}
              className={"text-muted-foreground"}
              aria-hidden="true"
            />
          ) : theme === "dark" ? (
            <Moon
              key="dark"
              size={ICON_SIZE}
              className={"text-muted-foreground"}
              aria-hidden="true"
            />
          ) : (
            <Laptop
              key="system"
              size={ICON_SIZE}
              className={"text-muted-foreground"}
              aria-hidden="true"
            />
          )}
          <span className="sr-only">{getCurrentThemeDescription(theme)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-content" 
        align="start"
        aria-label="Theme selection menu"
      >
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(e) => setTheme(e)}
          aria-label="Choose theme"
        >
          <DropdownMenuRadioItem 
            className="flex gap-2" 
            value="light"
            aria-label="Switch to light theme"
          >
            <Sun size={ICON_SIZE} className="text-muted-foreground" aria-hidden="true" />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem 
            className="flex gap-2" 
            value="dark"
            aria-label="Switch to dark theme"
          >
            <Moon size={ICON_SIZE} className="text-muted-foreground" aria-hidden="true" />
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem 
            className="flex gap-2" 
            value="system"
            aria-label="Use system theme preference"
          >
            <Laptop size={ICON_SIZE} className="text-muted-foreground" aria-hidden="true" />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
      <div id="theme-description" className="sr-only">
        Theme switcher. Current theme: {theme || 'system'}
      </div>
    </DropdownMenu>
  );
};

export { ThemeSwitcher };
