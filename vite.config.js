import {svelte} from '@sveltejs/vite-plugin-svelte'
import {execFileSync as exec} from 'child_process'
import fs from 'fs'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'

import pkg from './package.json'

const is_build = process.argv.includes('build')

const vars = {
    'window.__BUILD_DATE__': `'${new Date().toISOString()}'`,
    'window.__BUILD_HASH__': `'${exec('git', ['rev-parse', '--short', 'HEAD']).toString().trim()}'`,
    'window.__APP_VERSION__': `'${pkg.version}'`,
    'window.__DEBUG__': !is_build,
    'window.CONFIG': JSON.stringify({...pkg.config}),
}

if (!fs.existsSync('public/sql-wasm.wasm')) {
    const url = 'https://unpkg.com/sql.js/dist/sql-wasm.wasm'
    exec('curl', ['-sSL', url, '-o', 'public/sql-wasm.wasm'])
}

/** @type {import('vite').UserConfig}*/
export default {
    publicDir: is_build ? false : 'public',
    build: {
        reportCompressedSize: false,
        minify: false,
        sourcemap: true,
        lib: {
            entry: 'src/main.js',
            formats: ['es'],
            fileName: format => `bundle.${format}.js`,
        },
        rollupOptions: {
            input: './index.html',
            output: {
                inlineDynamicImports: true,
                intro: Object.entries(vars)
                    .map(([k, v]) => `${k} = ${v}`)
                    .join('\n'),
            },
        },
    },
    server: {
        host: !!process.env.VITE_HOST,
        watch: {
            ignored: 'android,ios,dist,dist-native'.split(',').map(x => path.resolve(x)),
        },
    },
    resolve: {
        alias: {
            '~': path.resolve('src'),
        },
    },
    define: is_build ? {} : vars,
    plugins: [
        svelte({
            onwarn(warning, handler) {
                const IGNORED_WARNINGS = [
                    'a11y_autofocus',
                    'a11y_click_events_have_key_events',
                    'a11y_no_static_element_interactions',
                    'a11y_no_noninteractive_element_interactions',
                    'a11y_label_has_associated_control',
                ]
                if (!IGNORED_WARNINGS.includes(warning.code)) handler(warning)
            },
        }),
        AutoImport({
            imports: ['svelte', 'svelte/store', 'svelte/transition', 'svelte/animate'],
            dts: './src/types/auto-imports.d.ts',
        }),
        {
            name: 'minify-sql-templates',
            enforce: 'post',
            transform(code, id) {
                if (
                    is_build &&
                    !id.includes('node_modules') &&
                    (id.endsWith('.js') || id.endsWith('.svelte')) &&
                    /sql`[^`]+\n.+?`/s.test(code)
                )
                    return {
                        code: code.replace(/sql`([^`]+\n.+?)`/gs, (_match, p1) => {
                            return `sql\`${p1.replace(/\n +/g, ' ')}\``
                        }),
                        map: null,
                    }
            },
        },
    ],
}
