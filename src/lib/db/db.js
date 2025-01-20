import {Capacitor} from '@capacitor/core'
import {CapacitorSQLite, SQLiteConnection} from '@capacitor-community/sqlite'

import migrationsSql from './migrations.sql?raw'

export const sqlite = new SQLiteConnection(CapacitorSQLite)
export let DATABASES = new Map()
export const default_db_name = 'data'
/** @type {() => import('@capacitor-community/sqlite').SQLiteDBConnection} */
export const db = () => DATABASES.get(default_db_name)

/**
 * @type {import("@capacitor-community/sqlite").capSQLiteVersionUpgrade[]}
 */
const migrations = migrationsSql
    .split(/^---\n--- (\d{4}).*\n---\n/m)
    .slice(1) // Remove the sources before the first separator
    .flatMap((block, index, array) => {
        if (index % 2 !== 0) return [] // Skip statements, we get below
        const version = parseInt(block)
        const statements = array[index + 1]?.trim()
        if (!statements) return []
        return [
            {
                toVersion: version,
                statements: statements.split(';\n\n').flatMap(stmt => stmt.trim() || []),
            },
        ]
    })

/**
 * Connects to a SQLite database.
 *
 * @param {string} db_name - The name of the database to connect to.
 * @param {number} load_to_version - The version to load the database to.
 * @param {boolean} read_only - Whether to open the database in read-only mode.
 * @returns {Promise<import('@capacitor-community/sqlite').SQLiteDBConnection>} A promise that resolves with the database connection.
 */
async function connect_to_database(db_name, load_to_version = 1, read_only = true) {
    const encrypted = false
    const mode = encrypted ? 'secret' : 'no-encryption'
    let db
    const conns_consistent = (await sqlite.checkConnectionsConsistency()).result
    const conn_exists = (await sqlite.isConnection(db_name, read_only)).result
    if (conns_consistent && conn_exists) {
        db = await sqlite.retrieveConnection(db_name, read_only)
    } else {
        try {
            // Workaround `Connection sources_metadata already exists` bug
            await sqlite.closeConnection(db_name, read_only)
        } catch {
            console.debug('connect_to_database: connection does not exist')
        }
        db = await sqlite.createConnection(db_name, encrypted, mode, load_to_version, read_only)
    }
    return db
}

/**
 * Opens a SQLite database connection.
 *
 * @param {Object} options - The options for opening the database.
 * @param {string} options.db_name - The name of the database to open.
 * @param {number} [options.load_to_version] - The version to load the database to. Defaults to the latest migration version or 1 if no migrations are defined.
 * @param {boolean} [options.read_only=true] - Whether to open the database in read-only mode.
 * @returns {Promise<import('@capacitor-community/sqlite').SQLiteDBConnection>} A promise that resolves with the database connection.
 * @throws {Error} If the database fails to open.
 */
export async function open_database({
    db_name = default_db_name,
    load_to_version = migrations.at(-1)?.toVersion || 1,
    read_only = true,
}) {
    if (read_only && !(await database_exists(db_name)))
        throw new Error(`open_database: database ${db_name} does not exist`)
    if (!read_only && db_name === default_db_name) {
        if (!(await database_exists(db_name))) {
            // For new users, only apply the first migration
            migrations.splice(1)
            migrations[0].toVersion = load_to_version
            // Prepend (empty) migrations, since a migration for each version is required
            const pre = Array.from({length: load_to_version - 1}, (_, i) => ({
                toVersion: i + 1,
                // On Android, a dummy statement is required
                statements: ['PRAGMA user_version = 1'],
            }))
            migrations.unshift(...pre)
        }
        await sqlite.addUpgradeStatement(db_name, migrations)
    }
    const db = await connect_to_database(db_name, load_to_version, read_only)
    await db.open()
    const res = (await db.isDBOpen()).result
    if (!res) {
        throw new Error('open_database: db is not opened')
    }
    DATABASES.set(db_name, db)
    return db
}

/**
 *
 * @param {string} db_name - The database name.
 */
export async function persist_sqlite(db_name = default_db_name) {
    if (Capacitor.getPlatform() === 'web') await sqlite.saveToStore(db_name)
}

/**
 *
 * @param {string} db_name - The database name.
 */
export async function close_database(db_name = default_db_name) {
    if (!DATABASES.has(db_name)) return
    const db = DATABASES.get(db_name)
    if ((await db.isDBOpen()).result) await db.close()
}

/**
 * @param {string} db_name - The database name.
 */
export async function database_exists(db_name = default_db_name) {
    return (await sqlite.isDatabase(db_name)).result || false
}
