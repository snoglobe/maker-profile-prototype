let users = [
    {
        replitUsername: "MasonMeirs",
        username: "snoglobe",
        projects: {},
        history: []
    },
    {
        replitUsername: "zachlatta",
        username: "zachlatta",
        projects: {},
        history: []
    }
];

// load users.json into users if it exists, otherwise create it
const fs = require('fs');
if (fs.existsSync('users.json')) {
    users = JSON.parse(fs.readFileSync('users.json').toString());
} else {
    fs.writeFileSync('users.json', JSON.stringify(users));
}

let express = require('express');
let cors = require('cors')
const request = require("request");

// post and get requests
let app = express();

app.use(cors())

// parse json
app.use(express.json());

// get request to get all users
app.get('/users', (req, res) => {
    res.send(users);
});

// post request to add a user
app.post('/users', (req, res) => {
    let user = req.body;
    // validate user
    if (!user.username || !user.projects) {
        res.status(400).send('Invalid user');
        return;
    }
    users.push(user);
    res.sendStatus(200);
});

//let body_thing = null

// get request to get a user by username
app.get('/users/:username', async (req, res) => {
   /*if(body_thing != null) {
        res.status(200).send(body_thing);
        return
    }*/
        let username = req.params.username;
    let user = users.find(user => user.username === username);

    // if user is not found
    if (!user) {
        res.status(404).send('User not found');
        return;
    }

    let result = {};

    let data = [];
    await fetch(`https://api.github.com/users/${username}/events/public?per_page=90`).then(res => res.json()).then(data_from => {
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

    // add user.projects to data in github commit format
    user.history.forEach(project => {
        data.push({
            date: project.time.toLocaleDateString(),
            commits: [{
                message: `Edited repl ${project.project.title}`
            }],
            event: {
                repo: {
                    name: project.project.url
                }
            }
        })
    });

    await fetch(`https://api.github.com/users/${username}`).then(res => res.json()).then(data_from => {
        console.log(data_from)
        if (data_from.name === null || data_from.name === undefined) {
            result.full_name = user.username;
        } else {
            result.full_name = data_from.name;
        }
    });

    // combine commits with same date and repo
    for (let i = 0; i < data.length; i++) {
        for (let j = i + 1; j < data.length; j++) {
            if(data[j] === undefined) continue;
            if (data[i].date === data[j].date && data[i].event.repo.name === data[j].event.repo.name) {
                data[i].commits = data[i].commits.concat(data[j].commits);
                data.splice(j, 1);
                j--;
            }
        }
    }

    // sort by date
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    // display in table
    let all_commits = data;
    // 90 days ago from today
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    let grid_data = [];

    for (let x = 0; x < 5; x++) {
        grid_data.push([]);
        for (let y = 0; y < 18; y++) {
            const cells = data.map(d => new Date(d.date).toLocaleDateString() === startDate.toLocaleDateString() ? d : null).filter(d => d !== null);
            if (cells.length > 0) {
                let info_commits = cells.map(cell => cell.commits.map(commit => {
                    return {
                        message: commit.message,
                        repo: cell.event.repo.name
                    }
                })).flat();
                grid_data[x].push({
                    date: new Date(startDate).toLocaleDateString(),
                    commits: info_commits
                });
            } else {
                grid_data[x].push({
                    date: new Date(startDate).toLocaleDateString(),
                    commits: []
                });
            }
            // increment date
            startDate.setDate(startDate.getDate() + 1);
        }
    }
    // sum commits with unique dates
    const sum = data.reduce((a, b) => a + b.commits.length, 0);
    // days with commits without ignore tag
    const days = (()=>{
        let sum = 0;
        let dates = [];
        data.forEach(d => {
            if (!dates.includes(d.date)) {
                sum++;
                dates.push(d.date);
            }
        });
        return sum;
    })();
    // calculate average commits per day
    const average = days / sum;
    // calculate perecentage of 90 days with commits
    const percentage = days / 90 * 100;
    // create a list of repos paired with amount of days committed
    const repos = data.map(d => d.event.repo.name);
    const repo_count = {};
    repos.forEach(repo => {
        if (repo_count[repo]) {
            repo_count[repo]++;
        } else {
            repo_count[repo] = 1;
        }
    });
    // create array where [[repo, days]...] sorted by days
    let most_commits = Object.entries(repo_count).sort((a, b) => b[1] - a[1]);
    res.status(200).send({
        ...result,
        grid_data: grid_data,
        most_commits: most_commits,
        all_commits: all_commits,
        sum: sum,
        days: days,
        average: average,
        percentage: percentage,
        replitname: user.replitUsername ? user.replitUsername : null,
    })
});

let query = `
query ProfilePublicRepls($username: String!, $pinnedReplsFirst: Boolean = true, $count: Int, $after: String, $order: String) {
        user: userByUsername(username: $username) {
          id
          username
          firstName
          displayName
          repls: publicRepls(pinnedReplsFirst: $pinnedReplsFirst, count: $count, after: $after, order: $order) {
            items {
              id
              language
              pinnedToProfile
              slug
              ...ProfilePublicReplsRepl
              ...ReplViewReplViewerRepl
            }
          }
        }
    }
    
    fragment ProfilePublicReplsRepl on Repl {
    description
    id
    isOwner
    pinnedToProfile
    timeCreated
    timeUpdated
    title
    url 
    user {
      id
      username
    }
    lang {
      id
      icon
      displayName
    }
    }
    
    fragment ReplViewReplViewerRepl on Repl {
    id
    url
    language
    slug
    prodUrl: hostedUrl(dotty: true)
    devUrl: hostedUrl
    }`
const replFetch = async () => {
    const fetch = (await import('node-fetch')).default;
    for (let user of users) {
        const apiUrl = 'https://replit.com/graphql';
        const headers = {
            'User-Agent': 'https://replit.com/@DimaDubina/get-your-apps-info',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.5',
            'Content-Type': 'application/json;charset=utf-8',
            'Origin': apiUrl,
            'Referer': 'https://replit.com/@DimaDubina/get-your-apps-info',
            'X-Requested-With': 'XMLHttpRequest'
        };

        const options = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                operationName: 'ProfilePublicRepls',
                variables: {
                    username: user.replitUsername,
                    pinnedReplsFirst: true,
                },
                query: query,
            }),
            timeout: 10000 // 10 seconds
        };

        try {
            const response = await fetch(apiUrl, options);
            const data = await response.json();
            console.log(JSON.stringify(data)); // replace with your own handling of the API response
            let projects = data.data.user.repls.items;
            if (projects.length !== user.projects.length) {
                user.projects = projects;
                console.log('Updated projects for ' + user.username);
                console.log(user);
            }
            for (let project of projects) {
                if (!user.projects.find(p => p.id === project.id)) {
                    user.projects.push(project);
                    user.history.push({
                        project: project,
                        time: new Date()
                    });
                    console.log('Added project ' + project.title + ' for ' + user.username);
                } else if (project.timeUpdated !== user.projects.find(p => p.id === project.id).timeUpdated) {
                    // if already updated today, continue
                    if (user.history.find(p => p.time.getDay() === (new Date()).getDay())) {
                        continue
                    }
                    user.history.push({
                        project: project,
                        time: new Date()
                    });
                    user.projects.find(p => p.id === project.id).timeUpdated = project.timeUpdated;
                    console.log('Updated project ' + project.title + ' for ' + user.username);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
    // save users.json
    fs.writeFile('users.json', JSON.stringify(users), (err) => {
        if (err) {
            console.log(err);
        }
    });
}

// poll repl.it for updates to projects
let poll = require('node-schedule').scheduleJob('*/1 * * * *', replFetch)

app.get('/replfetch', (req, res) => {
    replFetch();
    res.status(200).send('ok');
});

app.listen(8090, () => {
    console.log("liistening")
    replFetch()
})
