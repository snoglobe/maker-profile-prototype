<script>
	export let name;
</script>

<style>
	main {
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
		display: flex;
	}

	table {
		border-collapse: collapse;
	}
	tbody, th, td {
		border: 1px solid black;
		margin: 16px;
	}

	td {
		padding: 8px;
		border: 1px solid black;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>

<main>
	<div style="float: left">
	<textarea placeholder="Github Username" bind:value={name}></textarea>
	<button on:click={async () => {
		// fetch commits + dates of commits from github
		// display them in a table
	    let data = [];
	    await fetch(`https://api.github.com/users/${name}/events/public?per_page=90`).then(res => res.json()).then(data_from => {
			data_from.filter(event => event.type === 'PushEvent')
			.map(event => {
				const date = new Date(event.created_at);
				data.push({
					date: date.toLocaleDateString(),
					commits: event.payload.commits,
					event: event
				});
			})
		});
		console.log(data);
		for (let i = 0; i < data.length; i++) {
			// combine commits on the same day
			if (data[i].date === data[i+1]?.date) {
				data[i].commits = data[i].commits.concat(data[i+1].commits);
				data.splice(i+1, 1);
				i--;
			}
		}
		// insert psuedo-commits representing days without commits
		for (let i = 0; i < data.length; i++) {
			const date = new Date(data[i].date);
			const next_date = new Date(data[i+1]?.date);
			let difference = next_date ? (date - next_date) / (1000 * 3600 * 24) : 0;
			date.setDate(date.getDate() + 1);
			if (next_date && difference > 1) {
				data.splice(i+1, 0, {
					date: date.toLocaleDateString(),
					commits: [
						{
							message: '<strong>No commits on this day</strong>'
						}
					],
					event: {
						repo: {
							name: 'No Commits'
						}
					},
					tag: "ignore"
				});
				i++;
			}
		}
		// sort by date
		data.sort((a, b) => new Date(b.date) - new Date(a.date));
		// display in table
		document.getElementById('stats').innerHTML =
			data.map(d => `<tr><td>${d.date}</td> <td>${d.commits.map(e => `${d.event.repo.name} : ${e.message.length > 50 ? e.message.substr(0, 50) + '...' : e.message}`).join('<br>')}</td></tr>`).join('');

		// sum commits without ignore tag
		const sum = data.filter(d => !d.tag).reduce((a, b) => a + b.commits.length, 0);
		// days with commits without ignore tag
		const days = data.filter(d => !d.tag).length;
		// calculate average commits per day
		const average = sum / data.length;
		// calculate perecentage of 90 days with commits
		const percentage = sum / 90 * 100;
		// display stats
		document.getElementById('sum').innerHTML = `Total commits this season: ${sum}`;
		document.getElementById('days').innerHTML = `Total days with commits: ${days}`;
		document.getElementById('avg').innerHTML = `Average commits per day: ${average.toFixed(2)}`;
		document.getElementById('percent').innerHTML = `Percentage of days with commits: ${percentage.toFixed(2)}%`;
	}}>Submit</button>
	<!-- 18x5 grid -->
	<table>
		<thead>
			<tr>
				<th>Date</th>
				<th>Commits</th>
			</tr>
		</thead>
		<tbody id="stats">
		</tbody>
	</table>
	</div>
	<div style="float: right">
		<h1 id="sum">Total commits this season: </h1>
		<h1 id="days">Total days with commits: </h1>
		<h1 id="avg">Average commits per day: </h1>
		<h1 id="percent">Percentage of days with commits: </h1>
	</div>
</main>
