import { useTheme } from "./ThemeContext";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      <span className="theme-toggle__track">
        <span className="theme-toggle__thumb">
          {theme === "dark" ? "🌙" : "☀️"}
        </span>
      </span>
    </button>
  );
}
