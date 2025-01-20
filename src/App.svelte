{#if $session.loaded}
    <StatsWidget />
{/if}

<script>
    import StatsWidget from './components/StatsWidget.svelte'
    import { session } from './store'
</script>
