// Register Service Worker if supported
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .catch(err => console.log('Service Worker registration failed:', err));
}

document.getElementById('loadBtn').addEventListener('click', loadSleeperLeague);

async function loadSleeperLeague() {
  const leagueId = document.getElementById('leagueIdInput').value.trim();
  if (!leagueId) {
    alert('Please enter a valid Sleeper League ID');
    return;
  }

  try {
    // 1. Fetch League Info, Rosters, and Users
    const [leagueRes, rostersRes, usersRes] = await Promise.all([
      fetch(`https://api.sleeper.app/v1/league/${leagueId}`),
      fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`),
      fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`)
    ]);

    const leagueData = await leagueRes.json();
    const rosters = await rostersRes.json();
    const users = await usersRes.json();

    if (!leagueData || !rosters) {
      alert('Could not find league data. Check your League ID.');
      return;
    }

    // 2. Map Users by User ID for easy lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user.user_id] = {
        displayName: user.display_name,
        teamName: user.metadata?.team_name || user.display_name
      };
    });

    // 3. Format and Sort Rosters by Wins and Points For
    const standings = rosters.map(roster => {
      const owner = userMap[roster.owner_id] || { displayName: 'Unknown', teamName: 'Team ' + roster.roster_id };
      const wins = roster.settings.wins || 0;
      const losses = roster.settings.losses || 0;
      const ties = roster.settings.ties || 0;
      const fpts = roster.settings.fpts || 0;
      const fptsDecimal = roster.settings.fpts_decimal ? roster.settings.fpts_decimal / 100 : 0;
      const fptsAgainst = roster.settings.fpts_against || 0;

      return {
        teamName: owner.teamName,
        ownerName: owner.displayName,
        wins,
        losses,
        ties,
        pointsFor: (fpts + fptsDecimal).toFixed(2),
        pointsAgainst: fptsAgainst.toFixed(2)
      };
    });

    // Sort by Wins DESC, then Points For DESC
    standings.sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor);

    // 4. Render to HTML
    document.getElementById('leagueTitle').innerText = `${leagueData.name} Standings`;
    const tbody = document.getElementById('standingsBody');
    tbody.innerHTML = '';

    standings.forEach((team, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>#${index + 1}</strong></td>
        <td>${team.teamName}</td>
        <td>${team.ownerName}</td>
        <td>${team.wins} - ${team.losses} - ${team.ties}</td>
        <td>${team.pointsFor}</td>
        <td>${team.pointsAgainst}</td>
      `;
      tbody.appendChild(row);
    });

    document.getElementById('dashboard').classList.remove('hidden');

  } catch (error) {
    console.error('Error fetching Sleeper data:', error);
    alert('Failed to fetch data from Sleeper.');
  }
}
