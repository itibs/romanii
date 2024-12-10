<script>
    function toggle() {
        window.document.body.classList.toggle('dark-mode')
    }
</script>

<button on:click={toggle}>
	Dark/light mode
</button>