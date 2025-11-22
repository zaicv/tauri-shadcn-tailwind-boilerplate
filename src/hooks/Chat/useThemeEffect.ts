
import { useEffect } from 'react';


export const useThemeEffect = (theme: string) => {
useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);
};