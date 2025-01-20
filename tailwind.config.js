import {fontFamily} from 'tailwindcss/defaultTheme'
import plugin from 'tailwindcss/plugin'

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.svelte', './node_modules/components/src/*.svelte'],
    darkMode: 'class',
    future: {
        hoverOnlyWhenSupported: true,
    },
    experimental: {
        optimizeUniversalDefaults: true,
    },
    corePlugins: {
        container: false,
    },
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#059669',
                    dark: '#06b57f',
                },
            },
        },
    },
    plugins: [
        plugin(function ({addBase}) {
            addBase({
                ':root': {
                    '--color-primary': 'theme("colors.primary.DEFAULT")',
                    '--color-primary-dark': 'theme("colors.primary.dark")',
                    '--color-primary-rgb': '5, 150, 105',
                },
                'html[dir="rtl"]': {
                    fontFamily: ['SafariFakeFont', 'Noto', ...fontFamily.sans].join(', '),
                },
            })
        }),
        plugin(function spacing({matchUtilities, addUtilities, theme}) {
            matchUtilities(
                {
                    'space-s': value => ({
                        '> :not([hidden]) ~ :not([hidden])': {
                            '--tw-space-s-reverse': '0',
                            marginInlineEnd: `calc(${value} * var(--tw-space-s-reverse))`,
                            marginInlineStart: `calc(${value} * calc(1 - var(--tw-space-s-reverse)))`,
                        },
                    }),
                },
                {
                    supportsNegativeValues: true,
                    values: theme('space'),
                },
            )
            addUtilities({
                '.space-s-reverse > :not([hidden]) ~ :not([hidden])': {
                    '--tw-space-s-reverse': '1',
                },
            })
        }),
        function user_agent_variants({addVariant}) {
            addVariant('firefox', '@supports (-moz-appearance: none)')
            addVariant('safari', '@supports (background: -webkit-named-image(i))')
            addVariant('chrome', '@supports (-webkit-app-region: inherit)')
            addVariant('webkit', '@supports (-webkit-min-device-pixel-ratio:0)')
            addVariant('ios', '@supports (-webkit-touch-callout: none)')
        },
    ],
}
