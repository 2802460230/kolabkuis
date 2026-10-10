import type { Config } from "tailwindcss";

// Token desain: terinspirasi lembar jawaban komputer (LJK) —
// kertas putih kebiruan, tinta pensil navy, lingkaran jawaban merah muda, stabilo kuning.
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F6FA",
        ink: { DEFAULT: "#172340", soft: "#2C3A5C" },
        graphite: "#5B6274",
        line: "#D9DEE8",
        ljk: { DEFAULT: "#D6336C", soft: "#FBE3EC" },
        marker: "#FFE24A",
        benar: { DEFAULT: "#13784F", soft: "#DDF3E8" },
        salah: { DEFAULT: "#B42318", soft: "#FCE4E1" },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', "system-ui", "sans-serif"],
        body: ['"Atkinson Hyperlegible"', "system-ui", "sans-serif"],
      },
      maxWidth: { prose: "68ch" },
    },
  },
  plugins: [],
} satisfies Config;
