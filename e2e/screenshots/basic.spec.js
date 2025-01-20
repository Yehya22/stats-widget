// e2e/screenshots/basic.spec.js
import {chromium, test} from '@playwright/test'
import {readFileSync} from 'fs'
import {join} from 'path'

const devices = [
    {
        name: 'iPhone 6.5" Display',
        config: {
            viewport: {width: 414, height: 896},
            isMobile: true,
            hasTouch: true,
            userAgent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
            deviceScaleFactor: 3,
        },
    },
    {
        name: 'iPhone 5.5" Display',
        config: {
            viewport: {width: 414, height: 736},
            isMobile: true,
            hasTouch: true,
            userAgent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
            deviceScaleFactor: 3,
        },
    },
    {
        name: 'iPad 13" Display',
        config: {
            viewport: {width: 1024, height: 1366},
            isMobile: true,
            hasTouch: true,
            userAgent:
                'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
            deviceScaleFactor: 2,
        },
    },
    {
        name: 'iPad Pro 12.9" Display',
        config: {
            viewport: {width: 1024, height: 1366},
            isMobile: true,
            hasTouch: true,
            userAgent:
                'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
            deviceScaleFactor: 2,
        },
    },
]

const routes = [
    {path: '', name: 'home'},
    {path: 'subscription/youtube-PLCp8pahoEhI6cjnB552h0vWIWjuPaY03O', name: 'videoViewer'},
    {path: 'subscription/audio-albadr-usul-aliman', name: 'audioViewer'},
    {path: 'subscription/faidah-salaf_life_summary', name: 'textViewer'},
    {path: 'subscription/waqfeyah-3291', name: 'PDFViewer'},
    {path: 'library', name: 'library'},
    {path: 'category/3', name: 'category'},
    {path: 'timetable', name: 'timetable'},
    {path: 'settings', name: 'settings'},
    {path: 'bookmarks', name: 'bookmarks'},
]

test.describe('Capture screenshots across devices', () => {
    for (const device of devices) {
        test.describe(device.name, () => {
            let context
            let page

            test.beforeAll(async () => {
                context = await chromium.launchPersistentContext(
                    // eslint-disable-next-line no-undef
                    join(process.cwd(), `playwright-data/${device.name}`),
                    {
                        baseURL: 'http://localhost:5005',
                        headless: false,
                        ...device.config,
                        // Add any additional launch options here
                        timeout: 3 * 60 * 1000,
                    },
                )
                page = await context.newPage()
                // eslint-disable-next-line no-undef
                const data = JSON.parse(readFileSync(join(process.cwd(), 'test_idb.json'), 'utf8'))
                // Inject idb-keyval and setup the data
                await page.addInitScript(`
                    window.setupTestData = async () => {
                        const data = ${JSON.stringify(data)};
                        for (const [key, value] of Object.entries(data)) {
                            await window.kv.set(key, value);
                        }
                    }`)
                // Navigate to the page and run the setup
                await page.goto('/')
                await page.evaluate(() => window.setupTestData())
                await page.waitForLoadState('networkidle')
                await page.goto('/settings')
                // eslint-disable-next-line no-undef
                const test_db_json = readFileSync(join(process.cwd(), 'test_db.json'), 'utf8')
                await page.locator('#db-json-input').fill(JSON.stringify(JSON.parse(test_db_json)))
                await page.locator('svg.lucide-file-down').last().click()
                await page.waitForLoadState('networkidle', {timeout: 3 * 60 * 1000})
            })

            test.afterAll(async () => {
                await context.close()
            })

            test('capture screenshots', async () => {
                for (const [i, route] of routes.entries()) {
                    await page.goto(`/${route.path}`)
                    await page.waitForLoadState('networkidle')
                    await page.screenshot({
                        path: `screenshots/${device.name}-${i + 1}-${route.name}.png`,
                    })
                }
            })
        })
    }
})
