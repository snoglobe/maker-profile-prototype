<script>
	import GridElement from "./GridElement.svelte";
	const params = new Proxy(new URLSearchParams(window.location.search), {
		get: (searchParams, prop) => searchParams.get(prop),
	});
	export let name = params.username || "";
	export let replitname = "";
	export let grid_data = [];
	export let most_commits = [];
	export let all_commits = [];
	export let bigname = "";
	export let sum = 0;
	export let days = 0;
	export let average = 0;
	export let percentage = 0;

	fetch(`http://${window.location.host.split(':')[0]}:8090/users/${name}`).then(d => d.json()).then(d => {
		grid_data = d.grid_data;
		most_commits = d.most_commits;
		all_commits = d.all_commits;
		bigname = d.full_name;
		sum = d.sum;
		days = d.days;
		average = d.average;
		percentage = d.percentage;
		replitname = d.replitname;
	});

	const cyrb53 = (str, seed = 0) => {
		let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
		for(let i = 0, ch; i < str.length; i++) {
			ch = str.charCodeAt(i);
			h1 = Math.imul(h1 ^ ch, 2654435761);
			h2 = Math.imul(h2 ^ ch, 1597334677);
		}
		h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
		h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
		h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
		h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

		return 4294967296 * (2097151 & h2) + (h1 >>> 0);
	};

	String.prototype.hashCode = function() {
		return cyrb53(this);
	}

</script>

<style>
	main {
		padding: 1em;
		max-width: 240px;
		margin: 48px auto 0;
		display: flex;
		justify-content: space-around;
	}

	.commitBlock {
		display: flex;
/*		background-color: #f9f9f9;*/
		padding: 8px;
		border-radius: 8px;
		vertical-align: center;
		flex-direction: row;
		color: #1f2d3d;
		box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);
	}

	#feed {
		list-style: none;
		padding: 0;
	}

	h1 {
		font-size: xxx-large;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>

<main>
	<div>
		<div style="display: flex; align-items: center; margin-bottom: 32px">
			<img width="96" height="96" src={`https://github.com/${name}.png`} style="border-radius: 8px; box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);">
			<div style="margin-left: 16px">
				<h1 style="font-size: xx-large; margin-bottom: 3%">{bigname}</h1>
				<div style="display: flex">
					<div style="display: flex; ">
						<i class="fa fa-github" style="font-size: 24px">

						</i>
						<a href="https://github.com/{name}" style="margin-left: 8px; color: black; font-size: 16px">github</a>
					</div>

					{#if replitname !== null && replitname !== "" && replitname !== undefined}

						<div style="display: flex; margin-left: 8px">
							<span style="font-size: 20px">⠕</span><a href="https://replit.com/@{replitname}" style="margin-left: 4px; color: black; font-size: 16px">replit</a>
						</div>
					{/if}
				</div>
			</div>
		</div>
		<!-- 18x5 grid -->
		<table style="background-color: #f9f9f9; border-radius: 8px; padding-top: 8px; padding-left: 4px; padding-right: 4px; box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);">
			<tbody id="stats">
			{#each grid_data as row}
				<tr style="vertical-align: middle;">
					{#each row as col}
						<td style="text-align: center; vertical-align: middle;"><GridElement date={col.date} commits={col.commits}></GridElement> </td>
					{/each}
				</tr>
			{/each}
			</tbody>
		</table>
		<div style="display: grid; grid-template-columns: 1fr 1fr; grid-gap: 2%;" id="repolist">
			{#each most_commits as repo, i}
				<a href="https://github.com/{repo[0]}" style="color: black; text-decoration: none">

				<div class="commitBlock" style="display: block; background-color: hsl({repo[0].hashCode() % 360}, 70%, 95%">
					<span style="font-size: x-large">{i + 1}. </span>
					<strong>{repo[0]}</strong>
					<br>
					{repo[1]} days with commits
					</div></a>
			{/each}
		</div>
	</div>
	<div>
		<div style="display: grid; line-height: 32pt; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; margin: 16px">
			<div style="display: flex; flex-direction: column; text-align: center; margin: 8px">
				<h1 id="sum">{sum}</h1>
				<h2>total commits</h2>
			</div>
			<div style="display: flex; flex-direction: column; text-align: center; margin: 8px">
				<h1 id="days">{days}</h1>
				<h2>days with commits</h2>
			</div>
			<div style="display: flex; flex-direction: column; text-align: center; margin: 8px">
				<h1 id="avg">{average.toPrecision(3)}</h1>
				<h2>avg. commits/day</h2>
			</div>
			<div style="display: flex; flex-direction: column; text-align: center; margin: 8px">
				<h1 id="percent">{percentage.toPrecision(2)}%</h1>
				<h2>of days have commits</h2>
			</div>
		</div>
		<ul id="feed">
			{#each (() => {
				let result = all_commits.sort((a, b) => {
					return new Date(b.date) - new Date(a.date);
				});
				return result;
			})() as commit}
				<li><a href="http://github.com/{commit.event.repo.name}/commit/{commit.event.payload.commits[0].sha}" style="text-decoration: none"><div class="commitBlock" style="background-color: #f9f9f9"><div class="material-symbols-outlined" style="margin-right: 2%; margin-left: 2%">
commit
				</div><div>{commit.event.repo.name}</div><div style="margin-left: auto">{new Date(commit.date).toLocaleDateString()}</div></div></a></li>
			{/each}
		</ul>
	</div>

</main>
