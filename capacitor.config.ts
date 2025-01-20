import type {CapacitorConfig} from '@capacitor/cli'
import pkg from './package.json' with {type: 'json'}

export default {
    appId: pkg.config.domain,
    appName: pkg.config.name,
    webDir: 'dist-native',
    server: {
        hostname: pkg.name + '.local',
    }
} as CapacitorConfig
