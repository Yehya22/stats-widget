<!-- main layout -->
<div class="mx-auto max-w-fit rounded-3xl bg-gray-100 p-4 shadow-md dark:bg-gray-900">
    <div class="grid grid-cols-2">
        <div class="border-b border-e border-gray-300 pb-4 pe-4 dark:border-gray-700">
            <div class="mb-1 flex items-center gap-1 text-primary dark:text-primary-dark">
                <BookOpen class="h-4 w-4 shrink-0" />
                <span class="truncate text-xs">Content Consumed</span>
            </div>
            <div>
                <span class="text-2xl font-semibold text-gray-900 dark:text-gray-100"
                    >{stats?.pages_read ?? 0}</span
                >
            </div>
        </div>

        <div class="border-b border-gray-300 pb-4 ps-4 dark:border-gray-700">
            <div class="mb-1 flex items-center gap-1 text-primary dark:text-primary-dark">
                <Target class="h-4 w-4 shrink-0" />
                <span class="truncate text-xs">Due</span>
            </div>
            <div>
                <span class="text-2xl font-semibold text-gray-900 dark:text-gray-100"
                    >{stats?.due_items ?? 0}</span
                >
                <span class="text-xs font-normal text-gray-600 dark:text-gray-400"
                    >message</span
                >
            </div>
        </div>

        <div class="border-e border-gray-300 pe-4 pt-4 dark:border-gray-700">
            <div class="mb-1 flex items-center gap-1 text-primary dark:text-primary-dark">
                <Calendar class="h-4 w-4 shrink-0" />
                <span class="truncate text-xs">Monthly to Consume</span>
            </div>
            <div>
                <span class="text-2xl font-semibold text-gray-900 dark:text-gray-100"
                    >{stats?.monthly_to_consume ?? 0}</span
                >
            </div>
        </div>

        <div class="ps-4 pt-4">
            <div class="mb-1 flex items-center gap-1 text-primary dark:text-primary-dark">
                <TrendingUp class="h-4 w-4 shrink-0" />
                <span class="truncate text-xs">Streak</span>
            </div>
            <div>
                <span class="text-2xl font-semibold text-gray-900 dark:text-gray-100"
                    >{stats?.streak ?? 0}</span
                >
                <span class="text-xs font-normal text-gray-600 dark:text-gray-400">Days</span>
            </div>
        </div>
    </div>
    </div>

<script>
import {BookOpen, Calendar, Target, TrendingUp} from 'lucide-svelte'
import sql from 'sql-template-tag'

import {db} from '~/lib/db/db.js'

let stats = $state(null)

async function get_stats() {
    const query = sql`
        WITH daily_study AS (
            SELECT DISTINCT DATE(studied_at) as study_date
            FROM study_entries
            ORDER BY study_date DESC
        ),
        streak_calc AS (
            SELECT 
                study_date,
                JULIANDAY(study_date) - JULIANDAY(LAG(study_date) OVER (ORDER BY study_date)) as day_diff
            FROM daily_study
        ),
        streak_count AS (
            SELECT COUNT(*) as current_streak
            FROM (
                SELECT study_date, day_diff
                FROM streak_calc
                WHERE day_diff = -1 OR day_diff IS NULL
                ORDER BY study_date DESC
                LIMIT 1000
            )
        ),
        due_items AS (
            SELECT COUNT(DISTINCT s.id) as due_items 
            FROM subscriptions s 
            WHERE is_active = 1 
            AND has_ended = 0 
            AND due_up_to > has_read_up_to
        ),
        subscription_quantities AS (
            SELECT 
                SUM(quantity) as total_daily_quantity,
                SUM(src.len - sub.has_read_up_to) as total_remaining_quantity
            FROM subscriptions sub
            JOIN sources src ON sub.source_id = src.id
            WHERE sub.is_active = 1 AND sub.has_ended = 0
        )
        SELECT 
            (SELECT COALESCE(SUM(quantity), 0) FROM study_entries) as pages_read,
            (SELECT due_items FROM due_items) as due_items,
            (SELECT current_streak FROM streak_count) as streak,
            (SELECT total_daily_quantity FROM subscription_quantities) as total_daily_quantity,
            (SELECT total_remaining_quantity FROM subscription_quantities) as total_remaining_quantity
        FROM study_entries
        LIMIT 1
    `

    const result = ((await db().query(query.sql, query.values)).values || [{}])[0]
    const total_daily_quantity = result.total_daily_quantity || 0
    const total_remaining_quantity = result.total_remaining_quantity || 0

    return {
        pages_read: result.pages_read ?? 0,
        due_items: result.due_items ?? 0,
        monthly_to_consume: Math.min(total_daily_quantity * 30, total_remaining_quantity),
        streak: result.streak ?? 0,
    }
}

;(async () => {
    stats = await get_stats()
})()
</script>
