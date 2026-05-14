/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F4F1EA",
        "cream-2": "#EFEBE3",
        "cream-3": "#EAE5DB",
        ink: "#1A1A1A",
        "ink-2": "#0A0A0A",
        mute: "#6B6B6B",
        terracotta: "#B96A4B",
        sage: "#A8B89A",
        mocha: "#6B4F3A",
        sand: "#D6C7A8",
        walnut: "#5A3E2B",
        olive: "#4E5340",
        stone: "#D9D2C2",
      },
      fontFamily: {
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ['"Space Grotesk"', "Inter", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        "tighter-2": "-0.06em",
      },
      maxWidth: {
        container: "1500px",
      },
    },
  },
  plugins: [],
};
