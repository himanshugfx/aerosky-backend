/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                },
                dgca: {
                    blue: '#1e3a8a',
                    gold: '#f59e0b',
                }
            },
            boxShadow: {
                'premium': '0 8px 30px rgba(0, 0, 0, 0.02)',
                'premium-hover': '0 20px 40px rgba(0, 0, 0, 0.06)',
            }
        },
    },
    plugins: [],
}
