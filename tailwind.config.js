/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#064E3B',
                    light: '#065F46',
                },
                accent: {
                    DEFAULT: '#D4AF37',
                    light: '#F1D279',
                }
            },
            borderRadius: {
                'var': 'var(--radius)',
            }
        },
    },
    plugins: [],
}
