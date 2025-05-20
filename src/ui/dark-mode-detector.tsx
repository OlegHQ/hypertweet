import React, { useEffect } from "react";

// Dark mode detection component
export const DarkModeDetector: React.FC = () => {
  useEffect(() => {
    // Check system preference
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    // Function to update dark mode
    const updateDarkMode = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Set initial value
    updateDarkMode(darkModeMediaQuery);

    // Listen for changes
    darkModeMediaQuery.addEventListener("change", updateDarkMode);

    // Cleanup
    return () => {
      darkModeMediaQuery.removeEventListener("change", updateDarkMode);
    };
  }, []);

  return null;
};
