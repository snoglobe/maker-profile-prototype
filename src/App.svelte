<script>
	export let name;
</script>

<main>
	<textarea placeholder="Github Username" bind:value={name}></textarea>
	<button on:click={async () => {
		// fetch commits + dates of commits from github
		// display them in a table
	    let data = [];
	    await fetch(`https://api.github.com/users/${name}/events/public`).then(res => res.json()).then(data_from => {
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
		// insert psuedo-commits representing days without commits
		for (let i = 0; i < data.length; i++) {
			const date = new Date(data[i].date);
			const next_date = new Date(data[i+1]?.date);
			if (next_date && date.getDate() !== next_date.getDate()) {
				data.splice(i+1, 0, {
					date: date.toLocaleDateString(),
					commits: [
						{
							message: 'No commits on this day'
						}
					],
					event: {
						repo: {
							name: 'No Commits'
						}
					}
				});
				i++;
			}
		}
		// sort by date
		data.sort((a, b) => new Date(a.date) - new Date(b.date));
		// display in table
		document.getElementById('stats').innerHTML =
			data.map(d => `<tr><td>${d.date}</td><td>${d.commits.map(e => `${d.event.repo.name} : ${e.message}`).join('<br>')}</td></tr>`).join('');
	}}>Submit</button>
	<table>
		<thead>
			<tr>
				<th>Date</th>
				<th>Commit</th>
			</tr>
		</thead>
		<tbody id="stats">
		</tbody>
	</table>
</main>

<style>
	main {
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>