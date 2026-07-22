/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Tactical Telemetry palette (per industrial-brutalist-ui skill)
        void: "#0A0A0A",
        carbon: "#121212",
        panel: "#161616",
        edge: "#1F1F1F",
        lip: "#2A2A2A",
        ink: "#EAEAEA",
        ash: "#8A8A8A",
        dim: "#5A5A5A",
        hazard: "#FF2A2A",
        phosphor: "#4AF626",
        amber: "#E6A800",
      },
      fontFamily: {
        heavy: ["var(--font-heavy)", "Arial Black", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.06em",
      },
    },
  },
  plugins: [],
};
