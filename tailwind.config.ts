import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50:"#ecfdf5",100:"#d1fae5",200:"#a7f3d0",300:"#6ee7b7",400:"#34d399",500:"#10b981",600:"#059669",700:"#047857",800:"#065f46",900:"#064e3b" },
        ink: "#0f172a",
        mute: "#64748b"
      },
      boxShadow: { soft: "0 8px 30px rgba(15,23,42,0.06)" }
    },
  },
  plugins: [],
};
export default config;
