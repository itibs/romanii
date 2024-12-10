<script>
    function toggle() {
        window.document.body.classList.toggle('dark-mode')
    }
</script>

<button on:click={toggle}>
	Dark/light mode
</button>


<style>
    /* hidden until it works on vercel as well */
    button {
        visibility: hidden;
    }
</style>