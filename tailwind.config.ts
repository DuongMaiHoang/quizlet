import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                card: {
                    DEFAULT: "var(--card-bg)",
                    hover: "var(--card-hover)",
                },
                primary: {
                    DEFAULT: "var(--primary)",
                    hover: "var(--primary-hover)",
                },
                secondary: "var(--secondary)",
                success: "var(--success)",
                error: "var(--error)",
                border: "var(--border)",
                muted: "var(--muted)",
            },
        },
    },
    plugins: [],
};

export default config;
