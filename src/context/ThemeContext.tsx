import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    return saved || "dark";
  });

  const [isDark, setIsDark] = useState(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return theme === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const updateTheme = () => {
        const shouldBeDark = mediaQuery.matches;
        setIsDark(shouldBeDark);
        if (shouldBeDark) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
        // Force style recalculation
        void root.offsetHeight;
      };
      updateTheme();
      mediaQuery.addEventListener("change", updateTheme);
      return () => mediaQuery.removeEventListener("change", updateTheme);
    } else {
      const shouldBeDark = theme === "dark";
      setIsDark(shouldBeDark);
      if (shouldBeDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      // Force style recalculation
      void root.offsetHeight;
    }
  }, [theme]);

  // Apply theme on initial mount
  useEffect(() => {
    const root = document.documentElement;
    const saved = localStorage.getItem("theme") as Theme | null;
    const initialTheme = saved || "dark";
    
    if (initialTheme === "system") {
      const shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (shouldBeDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    } else {
      if (initialTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    console.log("🎨 Theme changing from", theme, "to", newTheme);
    
    // Update state first - this will trigger the useEffect
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Also apply immediately to ensure instant feedback
    const root = document.documentElement;
    if (newTheme === "system") {
      const shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(shouldBeDark);
      if (shouldBeDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    } else {
      const shouldBeDark = newTheme === "dark";
      setIsDark(shouldBeDark);
      if (shouldBeDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
    
    // Force a reflow to ensure styles are applied
    void root.offsetHeight;
    
    // Verify the class was applied
    const hasDarkClass = root.classList.contains("dark");
    console.log("✅ Theme applied:", newTheme, "| isDark:", shouldBeDark, "| dark class on html:", hasDarkClass);
    
    // Dispatch a custom event to notify components
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: newTheme, isDark: shouldBeDark } }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

