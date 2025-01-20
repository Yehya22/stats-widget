import {Capacitor} from '@capacitor/core'
import {defineCustomElements as jeep_sqlite} from 'jeep-sqlite/loader'
import {writable} from 'svelte/store'
import {defineCustomElements as pwa_elements} from '@ionic/pwa-elements/loader'

import {default_db_name, open_database, persist_sqlite, sqlite} from '~/lib/db/db.js'

export const session = writable({
    loaded: false,
})
;(async () => {
    if (Capacitor.getPlatform() === 'web') {
        pwa_elements(window)
        jeep_sqlite(window)
        const jeep_el = document.createElement('jeep-sqlite')
        jeep_el.wasmPath = ''
        document.body.appendChild(jeep_el)
        await sqlite.initWebStore()
    }
    await open_database({db_name: default_db_name, read_only: false})
    await persist_sqlite(default_db_name)

    session.update(s => ({...s, loaded: true}))
})()
