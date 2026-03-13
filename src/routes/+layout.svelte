<script>
    import DarkThemeButton from '/src/components/DarkThemeButton.svelte';
    import { onMount } from 'svelte';

    onMount(() => {
        let currentDate = new Date();
        let currentHour = currentDate.getHours();
        if (currentHour >= 22 || currentHour <= 7) {
            window.document.body.classList.add('dark-mode');
        }
    });
</script>

<slot />
<br>
<DarkThemeButton />

<style>
    :global(body) {
        transition: background-color 0.3s;
    }

    :global(body.dark-mode) {
        background-color: #10171d;
        color: #d7d7d7;
    }

    :global(body.dark-mode input, body.dark-mode textarea, body.dark-mode select) {
        background-color: #192028;
        color: #d7d7d7;
        border: 1px solid #3a4c61;
    }

    :global(body.dark-mode button) {
        background-color: #1a2e45;
        color: #d7d7d7;
        border: 1px solid #3a4c61;
    }

    :global(body.dark-mode button:hover) {
        background-color: #3a4c61;
    }

    :global(body.dark-mode input:focus, body.dark-mode textarea:focus) {
        border-color: #4a5b70;
        outline: none;
    }
</style>
