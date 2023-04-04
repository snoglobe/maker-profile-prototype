<script>
    export let date
    export let commits = []
    /* schema for commits
        {
            repo: string,
            message: string,
        }
     */

     // on hover, show a bubble with the date + commits for that day
    function showCommits() {
        let bubble = document.getElementById('bubble')
        bubble.style.display = 'block'
        bubble.style.left = event.clientX + 'px'
        bubble.style.top = event.clientY + 'px'
        bubble.innerHTML = `<h3>${date}</h3>`
        for (let commit of commits) {
            bubble.innerHTML += `<p>${commit.repo}: ${commit.message}</p>`
        }
    }

</script>