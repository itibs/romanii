<script>
    import SequentialTraining from '/src/components/SequentialTraining.svelte';
    import DarkThemeButton from '/src/components/DarkThemeButton.svelte';
    import { verses } from '/src/data/ps119';
    import { onMount } from 'svelte';

    let bookName = 'Psalmul 119'
    let start = {
        chapter: 1,
        verse: 1
    }

    onMount(() => {
        let currentDate = new Date();
        let currentHour = currentDate.getHours();
        if (currentHour >= 22 || currentHour <= 7) {
            window.document.body.classList.add('dark-mode')
        }
    });
</script>

<h1>Romanii</h1>
<SequentialTraining bookName={bookName} chapters={verses} start={start} useRollingSumVerseIdx={true}/>
<br>
<DarkThemeButton />

<!-- TODO: find a way to have dark-mode styles in a single file -->
<style>
    :global(body) {
        transition: background-color 0.3s;
    }

    :global(body.dark-mode) {
        background-color: #10171d;
        color: #d7d7d7;
    }

    /* Dark mode styles for inputs (textboxes) */
    :global(body.dark-mode input, body.dark-mode textarea, body.dark-mode select) {
        background-color: #192028;
        /* Darker background for inputs */
        color: #d7d7d7;
        /* Lighter text color */
        border: 1px solid #3a4c61;
        /* Subtle border for contrast */
    }

    /* Dark mode styles for buttons */
    :global(body.dark-mode button) {
        background-color: #1a2e45;
        /* Darker background for buttons */
        color: #d7d7d7;
        /* Lighter text color */
        border: 1px solid #3a4c61;
        /* Subtle border for contrast */
    }

    /* Button hover effect for a slightly lighter color */
    :global(body.dark-mode button:hover) {
        background-color: #3a4c61;
        /* Lighter background color on hover */
    }

    /* For input focus */
    :global(body.dark-mode input:focus, body.dark-mode textarea:focus) {
        border-color: #4a5b70;
        /* Slightly lighter border on focus */
        outline: none;
        /* Remove the default outline */
    }
</style>
