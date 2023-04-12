<style>
    /* Tooltip container */
    .tooltip {
        position: relative;
        display: inline-block;
        /* border-bottom: 1px dotted black; If you want dots under the hoverable text */
    }

    /* Tooltip text */
    .tooltip .tooltiptext {
        visibility: hidden;
        width: max-content;
        min-width: 100px;
        padding: 4px;
        background-color: black;
        color: #fff;
        text-align: center;
        border-radius: 6px;

        /* Position the tooltip text - see examples below! */
        position: absolute;
        z-index: 1;

        top: 125%;
        left: 50%;
        margin-left: -60px; /* Use half of the width (120/2 = 60), to center the tooltip */
    }

    /* Show the tooltip text when you mouse over the tooltip container */
    .tooltip:hover .tooltiptext {
        visibility: visible;
    }

    .gridItem {
        width: 16px;
        height: 16px;
        border-radius: 4px;
        margin: 2px;
    }
</style>

<script>
    export let date
    export let commits = []

    // combine commits in the same repo
    let commitsByRepo = {}
    commits.forEach(commit => {
        if (!commitsByRepo[commit.repo]) {
            commitsByRepo[commit.repo] = []
        }
        commitsByRepo[commit.repo].push(commit)
    })

    let tooltip_array = []
    for (let repo in commitsByRepo) {
        tooltip_array.push(`${commitsByRepo[repo].length} commits in ${repo} on ${date}`)
    }
    export function getTooltips() {
        return commits.length === 0 ? [`No commits on ${date}`] : tooltip_array
    }
</script>

<div class="gridItem tooltip" style="background-color: {commits.length === 0 ? `var(--slate)` : `var(--green)`}">
        <span class="tooltiptext">
        {#each getTooltips() as tooltip}
            {tooltip}<br>
        {/each}
        </span>
</div>