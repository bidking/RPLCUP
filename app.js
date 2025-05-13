document.addEventListener("DOMContentLoaded", () => {
    // Tournament Data Structure
    // setelah document.addEventListener("DOMContentLoaded", () => { …
// 1. Ambil elemen tombol reset-data
const resetDataBtn = document.getElementById("reset-data");

// 2. Tambahkan handler klik
resetDataBtn.addEventListener("click", () => {
  const ok = window.confirm("Apakah benar ingin mereset data?");
  if (ok) {
    // Hapus data turnamen di i
    localStorage.removeItem("tournamentData");
    // Muat ulang halaman agar initializeTournament() membuat data baru
    window.location.reload();
  }
});

    const tournamentData = {
        teams: {
            groupA: [
                { name: "rpl 1", id: "rpl1" },
                { name: "rpl 2", id: "rpl2" },
                { name: "rpl 3", id: "rpl3" },
                { name: "rpl 4", id: "rpl4" }
            ],
            groupB: [
                { name: "rpl 5", id: "rpl5" },
                { name: "rpl 6", id: "rpl6" },
               
            ]
        },
        matches: [],
        groupStandings: {
            groupA: [],
            groupB: []
        },
        knockoutStage: {
            semifinal1: null,
            semifinal2: null,
            thirdPlaceMatch: null,
            finalMatch: null,
            podium: {
                champion: null,
                runnerUp: null,
                thirdPlace: null
            }
        }
    };

    // Local Storage Management
    function saveToLocalStorage() {
        localStorage.setItem('tournamentData', JSON.stringify(tournamentData));
    }

    function loadFromLocalStorage() {
        const storedData = localStorage.getItem('tournamentData');
        if (storedData) {
            Object.assign(tournamentData, JSON.parse(storedData));
        }
        return tournamentData;
    }

    // Initialize Matches
   function initializeMatches() {
    const groups = ['groupA', 'groupB'];
    let matchId = 1;

    // Pertandingan Grup
    groups.forEach(groupKey => {
        const teams = tournamentData.teams[groupKey];
        // Untuk setiap tim dalam grup
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const match = {
                    id: matchId++,
                    teamA: null,  // Awalnya null, akan dipilih oleh pengguna
                    teamB: null,  // Awalnya null, akan dipilih oleh pengguna
                    group: groupKey,
                    scoreA: 0,
                    scoreB: 0,
                    completed: false,
                    stage: 'group'
                };
                tournamentData.matches.push(match);
            }
        }
    });

    // Pertandingan Knockout
    const knockoutMatches = [
        {
            id: matchId++,
            stage: 'semifinal1',
            teamA: null,
            teamB: null,
            scoreA: 0,
            scoreB: 0,
            completed: false
        },
        {
            id: matchId++,
            stage: 'semifinal2',
            teamA: null,
            teamB: null,
            scoreA: 0,
            scoreB: 0,
            completed: false
        },
        {
            id: matchId++,
            stage: 'thirdPlace',
            teamA: null,
            teamB: null,
            scoreA: 0,
            scoreB: 0,
            completed: false
        },
        {
            id: matchId++,
            stage: 'final',
            teamA: null,
            teamB: null,
            scoreA: 0,
            scoreB: 0,
            completed: false
        }
    ];

    tournamentData.matches.push(...knockoutMatches);
    saveToLocalStorage();
}

    // Group Stage Standings Calculation
    function calculateGroupStandings(group) {
        const standings = tournamentData.teams[group].map(team => ({
            ...team,
            matches: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            points: 0
        }));

        tournamentData.matches
            .filter(match => match.group === group && match.completed)
            .forEach(match => {
                const teamAIndex = standings.findIndex(t => t.id === match.teamA.id);
                const teamBIndex = standings.findIndex(t => t.id === match.teamB.id);

                standings[teamAIndex].matches++;
                standings[teamBIndex].matches++;

                standings[teamAIndex].goalsFor += match.scoreA;
                standings[teamAIndex].goalsAgainst += match.scoreB;
                standings[teamBIndex].goalsFor += match.scoreB;
                standings[teamBIndex].goalsAgainst += match.scoreA;

                if (match.scoreA > match.scoreB) {
                    standings[teamAIndex].wins++;
                    standings[teamAIndex].points += 3;
                    standings[teamBIndex].losses++;
                } else if (match.scoreA < match.scoreB) {
                    standings[teamBIndex].wins++;
                    standings[teamBIndex].points += 3;
                    standings[teamAIndex].losses++;
                } else {
                    standings[teamAIndex].draws++;
                    standings[teamBIndex].draws++;
                    standings[teamAIndex].points += 1;
                    standings[teamBIndex].points += 1;
                }
            });

        // Sort standings
        standings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const goalDiffB = b.goalsFor - b.goalsAgainst;
            const goalDiffA = a.goalsFor - a.goalsAgainst;
            if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
            return b.goalsFor - a.goalsFor; // If goal difference is equal, consider goals scored
        });

        tournamentData.groupStandings[group] = standings;
        saveToLocalStorage();
        return standings;
    }

    // Render Group Stage Tables
    function renderGroupStages() {
        const groups = ['A', 'B'];
        groups.forEach(group => {
            const tableBody = document.getElementById(`group-${group}-table`);
            const standings = calculateGroupStandings(`group${group}`);
            
            tableBody.innerHTML = standings.map((team, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${team.name}</td>
                    <td>${team.matches}</td>
                    <td>${team.wins}</td>
                    <td>${team.draws}</td>
                    <td>${team.losses}</td>
                    <td>${team.goalsFor}</td>
                    <td>${team.goalsAgainst}</td>
                    <td>${team.goalsFor - team.goalsAgainst}</td>
                    <td>${team.points}</td>
                </tr>
            `).join('');
        });
    }

    // Check if all group matches are completed
    function areAllGroupMatchesCompleted() {
        const groupMatches = tournamentData.matches.filter(m => m.stage === 'group');
        return groupMatches.every(m => m.completed);
    }

    // Prepare Knockout Stage
    function prepareKnockoutStage() {
        if (!areAllGroupMatchesCompleted()) {
            showNotification("Semua pertandingan grup harus diselesaikan terlebih dahulu!", true);
            return false;
        }

        const groupAStandings = tournamentData.groupStandings.groupA;
        const groupBStandings = tournamentData.groupStandings.groupB;

        if (groupAStandings.length < 2 || groupBStandings.length < 2) {
            showNotification("Data klasemen grup belum lengkap!", true);
            return false;
        }

        // Find and update semifinal matches
        const semifinal1Match = tournamentData.matches.find(m => m.stage === 'semifinal1');
        const semifinal2Match = tournamentData.matches.find(m => m.stage === 'semifinal2');

        // Semifinal 1: 1st Group A vs 2nd Group B
        semifinal1Match.teamA = groupAStandings[0];
        semifinal1Match.teamB = groupBStandings[1];

        // Semifinal 2: 1st Group B vs 2nd Group A
        semifinal2Match.teamA = groupBStandings[0];
        semifinal2Match.teamB = groupAStandings[1];

        saveToLocalStorage();
        updateKnockoutStageUI();
        return true;
    }

    // Update Knockout Stage UI
    function updateKnockoutStageUI() {
        const knockout = tournamentData.matches.filter(m => 
            ['semifinal1', 'semifinal2', 'thirdPlace', 'final'].includes(m.stage)
        );

        // Semifinal 1
        const semifinal1 = document.getElementById('semifinal-1');
        const sf1Team1 = semifinal1.querySelector('.bracket-team:first-child');
        const sf1Team2 = semifinal1.querySelector('.bracket-team:last-child');
        const semifinal1Match = knockout.find(m => m.stage === 'semifinal1');
        
        if (semifinal1Match.teamA && semifinal1Match.teamB) {
            sf1Team1.querySelector('.team-name').textContent = semifinal1Match.teamA.name;
            sf1Team2.querySelector('.team-name').textContent = semifinal1Match.teamB.name;
            sf1Team1.setAttribute('data-team-id', semifinal1Match.teamA.id);
            sf1Team2.setAttribute('data-team-id', semifinal1Match.teamB.id);
            semifinal1.setAttribute('data-match-id', semifinal1Match.id);
        }

        // Semifinal 2
        const semifinal2 = document.getElementById('semifinal-2');
        const sf2Team1 = semifinal2.querySelector('.bracket-team:first-child');
        const sf2Team2 = semifinal2.querySelector('.bracket-team:last-child');
        const semifinal2Match = knockout.find(m => m.stage === 'semifinal2');
        
        if (semifinal2Match.teamA && semifinal2Match.teamB) {
            sf2Team1.querySelector('.team-name').textContent = semifinal2Match.teamA.name;
            sf2Team2.querySelector('.team-name').textContent = semifinal2Match.teamB.name;
            sf2Team1.setAttribute('data-team-id', semifinal2Match.teamA.id);
            sf2Team2.setAttribute('data-team-id', semifinal2Match.teamB.id);
            semifinal2.setAttribute('data-match-id', semifinal2Match.id);
        }

        // Final
        const finalMatch = knockout.find(m => m.stage === 'final');
        const finalElement = document.getElementById('final');
        const finalTeam1 = finalElement.querySelector('.bracket-team:first-child');
        const finalTeam2 = finalElement.querySelector('.bracket-team:last-child');
        
        if (finalMatch.teamA && finalMatch.teamB) {
            finalTeam1.querySelector('.team-name').textContent = finalMatch.teamA.name;
            finalTeam2.querySelector('.team-name').textContent = finalMatch.teamB.name;
            finalTeam1.setAttribute('data-team-id', finalMatch.teamA.id);
            finalTeam2.setAttribute('data-team-id', finalMatch.teamB.id);
            finalElement.setAttribute('data-match-id', finalMatch.id);
        }

        // Third Place
        const thirdPlace = knockout.find(m => m.stage === 'thirdPlace');
        const thirdPlaceElement = document.getElementById('third-place');
        const thirdTeam1 = thirdPlaceElement.querySelector('.bracket-team:first-child');
        const thirdTeam2 = thirdPlaceElement.querySelector('.bracket-team:last-child');
        
        if (thirdPlace.teamA && thirdPlace.teamB) {
            thirdTeam1.querySelector('.team-name').textContent = thirdPlace.teamA.name;
            thirdTeam2.querySelector('.team-name').textContent = thirdPlace.teamB.name;
            thirdTeam1.setAttribute('data-team-id', thirdPlace.teamA.id);
            thirdTeam2.setAttribute('data-team-id', thirdPlace.teamB.id);
            thirdPlaceElement.setAttribute('data-match-id', thirdPlace.id);
        }
    }

    // Determine Knockout Stage Progression
    function updateKnockoutStageMatches() {
        const semifinal1 = tournamentData.matches.find(m => m.stage === 'semifinal1');
        const semifinal2 = tournamentData.matches.find(m => m.stage === 'semifinal2');
        const thirdPlaceMatch = tournamentData.matches.find(m => m.stage === 'thirdPlace');
        const finalMatch = tournamentData.matches.find(m => m.stage === 'final');

        // Determine Semifinal Winners for Final if both semifinals are completed
        if (semifinal1.completed && semifinal2.completed) {
            // Final Match Teams
            const sf1Winner = semifinal1.scoreA > semifinal1.scoreB ? semifinal1.teamA : semifinal1.teamB;
            const sf2Winner = semifinal2.scoreA > semifinal2.scoreB ? semifinal2.teamA : semifinal2.teamB;
            
            // Third Place Match Teams (Losers of Semifinals)
            const sf1Loser = semifinal1.scoreA > semifinal1.scoreB ? semifinal1.teamB : semifinal1.teamA;
            const sf2Loser = semifinal2.scoreA > semifinal2.scoreB ? semifinal2.teamB : semifinal2.teamA;

            // Update Final and Third Place Match
            finalMatch.teamA = sf1Winner;
            finalMatch.teamB = sf2Winner;
            thirdPlaceMatch.teamA = sf1Loser;
            thirdPlaceMatch.teamB = sf2Loser;

            saveToLocalStorage();
            updateKnockoutStageUI();
        }

        // Update podium if finals are completed
        if (finalMatch.completed || thirdPlaceMatch.completed) {
            updatePodiumUI();
        }
    }

    // Update Podium UI
    function updatePodiumUI() {
        const finalMatch = tournamentData.matches.find(m => m.stage === 'final');
        const thirdPlaceMatch = tournamentData.matches.find(m => m.stage === 'thirdPlace');

        // Championship Determination
        if (finalMatch.completed) {
            const champion = finalMatch.scoreA > finalMatch.scoreB ? finalMatch.teamA : finalMatch.teamB;
            const runnerUp = finalMatch.scoreA > finalMatch.scoreB ? finalMatch.teamB : finalMatch.teamA;

            document.getElementById('champion').textContent = champion.name;
            document.getElementById('runner-up').textContent = runnerUp.name;
            
            tournamentData.knockoutStage.podium.champion = champion;
            tournamentData.knockoutStage.podium.runnerUp = runnerUp;
        }

        // Third Place Determination
        if (thirdPlaceMatch.completed) {
            const thirdPlace = thirdPlaceMatch.scoreA > thirdPlaceMatch.scoreB 
                ? thirdPlaceMatch.teamA 
                : thirdPlaceMatch.teamB;

            document.getElementById('third-place-winner').textContent = thirdPlace.name;
            tournamentData.knockoutStage.podium.thirdPlace = thirdPlace;
        }
        
        saveToLocalStorage();
    }

    // Navigation and Tab Setup
    const navLinks = document.querySelectorAll("nav a");
    const sections = document.querySelectorAll("main section");

    navLinks.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            const sectionId = link.getAttribute("data-section");
            sections.forEach(section => {
                section.classList.remove("active");
                if (section.id === sectionId) {
                    section.classList.add("active");
                }
            });
            
            // Update group standings when viewing the group stage tab
            if (sectionId === "group-stage") {
                renderGroupStages();
            }
            
            // Update knockout stage UI when viewing that tab
            if (sectionId === "knockout") {
                if (areAllGroupMatchesCompleted()) {
                    prepareKnockoutStage();
                }
            }
        });
    });

    // Group Tabs
    const tabButtons = document.querySelectorAll(".tab-btn");
    const groupTables = document.querySelectorAll(".group-table");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            groupTables.forEach(table => table.classList.remove("active"));

            btn.classList.add("active");
            const group = btn.getAttribute("data-group");
            document.getElementById(`group-${group}`).classList.add("active");
        });
    });

    // Match Management
    let currentMatchIndex = 0;
    const scoreAInput = document.getElementById("score-a");
    const scoreBInput = document.getElementById("score-b");

   function updateMatchDisplay() {
    const matches = tournamentData.matches;
    if (matches.length === 0 || currentMatchIndex >= matches.length) {
        return;
    }
    
    const match = matches[currentMatchIndex];
    document.querySelector(".match-id").textContent = `Game ${match.id}`;
    document.querySelector(".match-stage").textContent = match.stage === 'group' ? 
        `Grup ${match.group?.replace('group', '')}` : 
        formatStageName(match.stage);
        
    document.querySelector(".team-a .team-name").textContent = match.teamA ? match.teamA.name : 'Belum dipilih';
    document.querySelector(".team-b .team-name").textContent = match.teamB ? match.teamB.name : 'Belum dipilih';
    document.getElementById("current-match-display").textContent = `Game ${match.id}`;
    scoreAInput.value = match.scoreA;
    scoreBInput.value = match.scoreB;

    // Nonaktifkan input jika tim belum ditentukan
    const inputsDisabled = !match.teamA || !match.teamB;
    scoreAInput.disabled = inputsDisabled;
    scoreBInput.disabled = inputsDisabled;
    document.querySelectorAll(".goal-btn").forEach(btn => {
        btn.disabled = inputsDisabled;
    });
    document.getElementById("submit-score").disabled = inputsDisabled;
    
    // Tampilkan pesan jika tim belum dipilih
    if (inputsDisabled) {
        document.getElementById("submit-score").setAttribute("title", "Pilih tim terlebih dahulu pada tab Penentuan Tim");
    } else {
        document.getElementById("submit-score").removeAttribute("title");
    }
}

    function formatStageName(stage) {
        switch(stage) {
            case 'semifinal1': return 'Semifinal 1';
            case 'semifinal2': return 'Semifinal 2';
            case 'thirdPlace': return 'Perebutan Juara 3';
            case 'final': return 'Final';
            default: return stage;
        }
    }

   function renderMatchList() {
    const list = document.getElementById("all-matches");
    list.innerHTML = "";
    
    // Pertandingan grup terlebih dahulu
    const groupMatches = tournamentData.matches.filter(match => match.stage === 'group');
    const knockoutMatches = tournamentData.matches.filter(match => match.stage !== 'group');
    
    // Tambahkan pertandingan grup
    groupMatches.forEach(match => {
        const li = document.createElement("li");
        const teamAName = match.teamA ? match.teamA.name : 'Belum dipilih';
        const teamBName = match.teamB ? match.teamB.name : 'Belum dipilih';
        li.innerHTML = `
            <span>${teamAName} vs ${teamBName} (${match.group ? match.group.replace('group', 'Grup ') : match.stage})</span>
            <span class="match-result ${match.completed ? 'match-completed' : 'match-pending'}">
                ${match.completed ? `${match.scoreA} - ${match.scoreB}` : (match.teamA && match.teamB) ? "Belum dimainkan" : "Tim belum dipilih"}
            </span>
        `;
        li.setAttribute('data-match-id', match.id);
        li.setAttribute('data-match-index', tournamentData.matches.indexOf(match));
        li.classList.add('match-item');
        list.appendChild(li);
    });
    
    // Tambahkan pertandingan knockout jika tersedia
    if (knockoutMatches.some(m => m.teamA && m.teamB)) {
        knockoutMatches.forEach(match => {
            if (match.teamA && match.teamB) {
                const li = document.createElement("li");
                const stageName = formatStageName(match.stage);
                li.innerHTML = `
                    <span>${match.teamA.name} vs ${match.teamB.name} (${stageName})</span>
                    <span class="match-result ${match.completed ? 'match-completed' : 'match-pending'}">
                        ${match.completed ? `${match.scoreA} - ${match.scoreB}` : "Belum dimainkan"}
                    </span>
                `;
                li.setAttribute('data-match-id', match.id);
                li.setAttribute('data-match-index', tournamentData.matches.indexOf(match));
                li.classList.add('match-item');
                list.appendChild(li);
            }
        });
    }
    
    // Tambahkan event klik untuk setiap item pertandingan
    document.querySelectorAll('.match-item').forEach(item => {
        item.addEventListener('click', () => {
            const matchIndex = parseInt(item.getAttribute('data-match-index'));
            currentMatchIndex = matchIndex;
            updateMatchDisplay();
            
            // Scroll ke area input pertandingan
            document.querySelector('.match-card').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

    document.getElementById("prev-match").addEventListener("click", () => {
        if (currentMatchIndex > 0) {
            currentMatchIndex--;
            updateMatchDisplay();
        }
    });

    document.getElementById("next-match").addEventListener("click", () => {
        if (currentMatchIndex < tournamentData.matches.length - 1) {
            currentMatchIndex++;
            updateMatchDisplay();
        }
    });

    document.querySelectorAll(".goal-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const team = btn.getAttribute("data-team");
            if (team === "a") {
                scoreAInput.value = parseInt(scoreAInput.value || 0) + 1;
            } else {
                scoreBInput.value = parseInt(scoreBInput.value || 0) + 1;
            }
        });
    });

    document.getElementById("submit-score").addEventListener("click", () => {
        const match = tournamentData.matches[currentMatchIndex];
        
        if (!match.teamA || !match.teamB) {
            showNotification("Tim belum ditentukan untuk pertandingan ini!", true);
            return;
        }
        
        match.scoreA = parseInt(scoreAInput.value || 0);
        match.scoreB = parseInt(scoreBInput.value || 0);
        match.completed = true;

        saveToLocalStorage();
        
        // Handle group stage completion
        if (match.stage === 'group') {
            renderGroupStages();
            
            // Check if all group matches are completed to set up knockout stage
            if (areAllGroupMatchesCompleted()) {
                prepareKnockoutStage();
                showNotification("Semua pertandingan grup selesai! Knockout stage telah disiapkan.");
            }
        }
        
        // Handle semifinal completion - set up final and third place matches
        if (match.stage === 'semifinal1' || match.stage === 'semifinal2') {
            const otherSemifinal = tournamentData.matches.find(m => 
                (m.stage === 'semifinal1' || m.stage === 'semifinal2') && m.stage !== match.stage
            );
            
            if (otherSemifinal.completed) {
                updateKnockoutStageMatches();
                showNotification("Semifinal selesai! Final dan perebutan juara 3 telah disiapkan.");
            }
        }
        
        // Handle final and third place completion
        if (match.stage === 'final' || match.stage === 'thirdPlace') {
            updateKnockoutStageMatches();
        }
        
        renderMatchList();
        showNotification("Skor berhasil disimpan!");
    });

    document.getElementById("reset-score").addEventListener("click", () => {
        scoreAInput.value = 0;
        scoreBInput.value = 0;
    });

    // Add click handlers to knockout bracket matches
    function setupKnockoutMatchClicks() {
        const bracketMatches = document.querySelectorAll('.bracket-match');
        bracketMatches.forEach(match => {
            match.addEventListener('click', () => {
                const matchId = match.getAttribute('data-match-id');
                if (matchId) {
                    const matchIndex = tournamentData.matches.findIndex(m => m.id == matchId);
                    if (matchIndex !== -1) {
                        // Switch to schedule tab and show the selected match
                        document.querySelector('[data-section="schedule"]').click();
                        currentMatchIndex = matchIndex;
                        updateMatchDisplay();
                    }
                } else {
                    showNotification("Pertandingan belum tersedia. Selesaikan pertandingan grup terlebih dahulu.", true);
                }
            });
        });
    }

    // Notification
    function showNotification(message, isError = false) {
        const notif = document.getElementById("notification");
        const content = notif.querySelector(".notification-content");
        
        if (isError) {
            content.classList.add("error");
        } else {
            content.classList.remove("error");
        }
        
        notif.querySelector(".notification-message").textContent = message;
        notif.classList.add("show");
        
        setTimeout(() => {
            notif.classList.remove("show");
        }, 3000);
    }

    document.querySelector(".notification-close").addEventListener("click", () => {
        document.getElementById("notification").classList.remove("show");
    });
// Fungsi-fungsi untuk setup tim
function initializeTeamSetup() {
    // Render tab setup tim
    renderTeamSetup();
    
    // Setup event listeners untuk tab grup
    const setupTabButtons = document.querySelectorAll(".setup-tab-btn");
    setupTabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            setupTabButtons.forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".setup-group").forEach(g => g.classList.remove("active"));
            
            btn.classList.add("active");
            const group = btn.getAttribute("data-setup-group");
            document.getElementById(`setup-group-${group}`).classList.add("active");
        });
    });
    
    // Setup event listener untuk modal
    const modal = document.getElementById("team-selection-modal");
    const closeModal = document.querySelector(".close-modal");
    const cancelBtn = document.getElementById("select-team-cancel");
    
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });
    
    cancelBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });
    
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
    
    // Event listener untuk konfirmasi pemilihan tim
    document.getElementById("select-team-confirm").addEventListener("click", confirmTeamSelection);
}

// Render tabel setup tim
function renderTeamSetup() {
    const groups = ['A', 'B'];
    
    groups.forEach(group => {
        const groupMatches = tournamentData.matches.filter(m => 
            m.stage === 'group' && m.group === `group${group}`
        );
        
        const tableBody = document.getElementById(`setup-matches-${group}`);
        tableBody.innerHTML = '';
        
        groupMatches.forEach(match => {
            const row = document.createElement('tr');
            
            // Match ID
            const idCell = document.createElement('td');
            idCell.textContent = `Game ${match.id}`;
            
            // Tim A
            const teamACell = document.createElement('td');
            const teamABtn = document.createElement('button');
            teamABtn.textContent = match.teamA ? match.teamA.name : "Pilih Tim A";
            teamABtn.classList.add('select-team-btn');
            teamABtn.dataset.matchId = match.id;
            teamABtn.dataset.teamPosition = 'teamA';
            teamABtn.addEventListener('click', openTeamSelection);
            teamACell.appendChild(teamABtn);
            
            // VS
            const vsCell = document.createElement('td');
            vsCell.textContent = "VS";
            vsCell.classList.add('vs-text');
            
            // Tim B
            const teamBCell = document.createElement('td');
            const teamBBtn = document.createElement('button');
            teamBBtn.textContent = match.teamB ? match.teamB.name : "Pilih Tim B";
            teamBBtn.classList.add('select-team-btn');
            teamBBtn.dataset.matchId = match.id;
            teamBBtn.dataset.teamPosition = 'teamB';
            teamBBtn.addEventListener('click', openTeamSelection);
            teamBCell.appendChild(teamBBtn);
            
            // Reset button
            const actionCell = document.createElement('td');
            const resetBtn = document.createElement('button');
            resetBtn.textContent = "Reset";
            resetBtn.classList.add('secondary-btn');
            resetBtn.dataset.matchId = match.id;
            resetBtn.addEventListener('click', resetMatchTeams);
            
            // Disable reset button if match is completed
            if (match.completed) {
                resetBtn.disabled = true;
                teamABtn.disabled = true;
                teamBBtn.disabled = true;
            }
            
            actionCell.appendChild(resetBtn);
            
            // Append cells to row
            row.appendChild(idCell);
            row.appendChild(teamACell);
            row.appendChild(vsCell);
            row.appendChild(teamBCell);
            row.appendChild(actionCell);
            
            // Append row to table
            tableBody.appendChild(row);
        });
    });
}

// Reset tim untuk pertandingan tertentu
function resetMatchTeams(e) {
    const matchId = e.target.dataset.matchId;
    const matchIndex = tournamentData.matches.findIndex(m => m.id == matchId);
    
    if (matchIndex !== -1) {
        const match = tournamentData.matches[matchIndex];
        
        // Jika pertandingan sudah selesai, jangan izinkan reset
        if (match.completed) {
            showNotification("Tidak dapat mereset pertandingan yang sudah selesai!", true);
            return;
        }
        
        // Reset tim
        match.teamA = null;
        match.teamB = null;
        match.scoreA = 0;
        match.scoreB = 0;
        
        // Simpan perubahan dan update UI
        saveToLocalStorage();
        renderTeamSetup();
        renderMatchList();
        updateMatchDisplay();
        
        showNotification("Tim pada pertandingan telah direset!");
    }
}

// Buka modal pemilihan tim
function openTeamSelection(e) {
    const matchId = e.target.dataset.matchId;
    const teamPosition = e.target.dataset.teamPosition;
    const match = tournamentData.matches.find(m => m.id == matchId);
    
    // Jika pertandingan sudah selesai, jangan izinkan perubahan
    if (match.completed) {
        showNotification("Tidak dapat mengubah tim untuk pertandingan yang sudah selesai!", true);
        return;
    }
    
    // Tentukan grup dari pertandingan
    const group = match.group;
    const groupLetter = group.replace('group', '');
    
    // Setup modal untuk pemilihan tim
    document.getElementById("current-match-id").value = matchId;
    document.getElementById("current-team-position").value = teamPosition;
    
    // Setup judul sesuai posisi tim
    const selectionTitle = document.getElementById("team-selection-title");
    selectionTitle.textContent = teamPosition === 'teamA' ? "Pilih Tim A" : "Pilih Tim B";
    
    // Dapatkan tim yang tersedia dari grup yang sama
    const availableTeams = [...tournamentData.teams[group]];
    
    // Dapatkan tim yang sudah dipilih untuk pertandingan ini
    const otherTeamPosition = teamPosition === 'teamA' ? 'teamB' : 'teamA';
    const otherTeam = match[otherTeamPosition];
    
    // Render daftar tim yang tersedia
    const teamsList = document.getElementById("teams-list");
    teamsList.innerHTML = '';
    
    availableTeams.forEach(team => {
        const teamElement = document.createElement('div');
        teamElement.classList.add('team-option');
        teamElement.textContent = team.name;
        teamElement.dataset.teamId = team.id;
        
        // Tandai tim yang dipilih
        if (match[teamPosition] && match[teamPosition].id === team.id) {
            teamElement.classList.add('selected');
        }
        
        // Nonaktifkan tim yang sudah dipilih di posisi lain
        if (otherTeam && otherTeam.id === team.id) {
            teamElement.style.opacity = '0.5';
            teamElement.style.cursor = 'not-allowed';
        } else {
            teamElement.addEventListener('click', selectTeam);
        }
        
        teamsList.appendChild(teamElement);
    });
    
    // Tampilkan modal
    document.getElementById("team-selection-modal").style.display = "block";
}

// Pilih tim
function selectTeam(e) {
    // Hapus seleksi sebelumnya
    document.querySelectorAll('.team-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Tandai tim yang dipilih
    e.target.classList.add('selected');
}

// Konfirmasi pemilihan tim
function confirmTeamSelection() {
    const matchId = document.getElementById("current-match-id").value;
    const teamPosition = document.getElementById("current-team-position").value;
    const selectedTeam = document.querySelector('.team-option.selected');
    
    if (!selectedTeam) {
        showNotification("Silakan pilih tim terlebih dahulu!", true);
        return;
    }
    
    const teamId = selectedTeam.dataset.teamId;
    const matchIndex = tournamentData.matches.findIndex(m => m.id == matchId);
    
    if (matchIndex !== -1) {
        const match = tournamentData.matches[matchIndex];
        const group = match.group;
        
        // Temukan tim dari data
        const selectedTeamData = tournamentData.teams[group].find(t => t.id === teamId);
        
        // Periksa apakah tim sudah dipilih di posisi lain
        const otherPosition = teamPosition === 'teamA' ? 'teamB' : 'teamA';
        if (match[otherPosition] && match[otherPosition].id === teamId) {
            showNotification("Tim tidak dapat bermain melawan dirinya sendiri!", true);
            return;
        }
        
        // Assign tim ke pertandingan
        match[teamPosition] = selectedTeamData;
        
        // Simpan perubahan
        saveToLocalStorage();
        
        // Update UI
        renderTeamSetup();
        renderMatchList();
        updateMatchDisplay();
        
        // Tutup modal
        document.getElementById("team-selection-modal").style.display = "none";
        
        showNotification(`Tim ${selectedTeamData.name} telah dipilih sebagai Tim ${teamPosition === 'teamA' ? 'A' : 'B'}!`);
    }
}
    // Initialize Tournament
   function initializeTournament() {
    const savedData = loadFromLocalStorage();
    
    // Jika tidak ada pertandingan yang disimpan, inisialisasi
    if (savedData.matches.length === 0) {
        initializeMatches();
    }

    // Update elemen UI berdasarkan data yang tersimpan
    updateMatchDisplay();
    renderMatchList();
    renderGroupStages();
    
    // Inisialisasi tab setup tim
    initializeTeamSetup();
    
    // Siapkan tahap knockout jika kondisinya terpenuhi
    if (areAllGroupMatchesCompleted()) {
        prepareKnockoutStage();
        
        // Periksa penyelesaian semifinal
        const semifinal1 = tournamentData.matches.find(m => m.stage === 'semifinal1');
        const semifinal2 = tournamentData.matches.find(m => m.stage === 'semifinal2');
        
        if (semifinal1.completed && semifinal2.completed) {
            updateKnockoutStageMatches();
        }
        
        // Periksa penyelesaian final dan perebutan juara 3
        const finalMatch = tournamentData.matches.find(m => m.stage === 'final');
        const thirdPlaceMatch = tournamentData.matches.find(m => m.stage === 'thirdPlace');
        
        if (finalMatch.completed || thirdPlaceMatch.completed) {
            updatePodiumUI();
        }
    }
    
    // Siapkan klik pertandingan knockout
    setupKnockoutMatchClicks();
}


    // Initialize the tournament
    initializeTournament();
});

// JavaScript to enhance mobile responsiveness
document.addEventListener('DOMContentLoaded', function() {
  // Add data-label attributes to table cells for mobile view
  function addDataLabelsToTables() {
    // For Group A table
    const groupATable = document.getElementById('group-A-table');
    if (groupATable) {
      addDataLabelsToTable(groupATable, [
        'No', 'Tim', 'M', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'
      ]);
    }
    
    // For Group B table
    const groupBTable = document.getElementById('group-B-table');
    if (groupBTable) {
      addDataLabelsToTable(groupBTable, [
        'No', 'Tim', 'M', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'
      ]);
    }
  }
  
  // Helper function to add data-label attributes to each cell in a table
  function addDataLabelsToTable(tableBody, headers) {
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (index < headers.length) {
          cell.setAttribute('data-label', headers[index]);
        }
      });
    });
  }
  
  // Function to handle mobile-specific UI adjustments
  function handleMobileUI() {
    const isMobile = window.innerWidth <= 768;
    const isSmallScreen = window.innerWidth <= 576;
    
    // Add or remove mobile-specific classes
    document.body.classList.toggle('mobile-view', isMobile);
    document.body.classList.toggle('small-screen', isSmallScreen);
    
    // Adjust match list for better mobile viewing
    const matchList = document.getElementById('all-matches');
    if (matchList) {
      const matches = matchList.querySelectorAll('li');
      matches.forEach(match => {
        if (isMobile) {
          // Add match details label for mobile
          const matchResult = match.querySelector('.match-result');
          if (matchResult && !matchResult.querySelector('.match-details-label')) {
            const label = document.createElement('div');
            label.className = 'match-details-label';
            label.textContent = ':';
            matchResult.insertBefore(label, matchResult.firstChild);
          }
        } else {
          // Remove mobile-specific elements
          const label = match.querySelector('.match-details-label');
          if (label) {
            label.remove();
          }
        }
      });
    }
    
    // Handle setup tables for mobile
    if (isSmallScreen) {
      simplifySetupTables();
    }
  }
  
  // Helper function to simplify setup tables for mobile
  function simplifySetupTables() {
    const setupTablesA = document.getElementById('setup-matches-A');
    const setupTablesB = document.getElementById('setup-matches-B');
    
    [setupTablesA, setupTablesB].forEach(table => {
      if (table) {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
          // Add a match label to first cell
          const firstCell = row.querySelector('td:first-child');
          if (firstCell && !firstCell.querySelector('.match-label')) {
            const currentText = firstCell.textContent;
            firstCell.innerHTML = `<div class="match-label">Match:</div>${currentText}`;
          }
        });
      }
    });
  }
  
  // Initial setup
  addDataLabelsToTables();
  handleMobileUI();
  
  // Re-run on window resize
  window.addEventListener('resize', function() {
    handleMobileUI();
  });
  
  // IMPROVED SWIPE DETECTION - Variables
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let isScrollingTable = false;
  
  // Track if we're touching inside a table responsive container
  const tableContainers = document.querySelectorAll('.table-responsive');
  tableContainers.forEach(container => {
    container.addEventListener('touchstart', () => {
      isScrollingTable = true;
    }, false);
    
    container.addEventListener('touchend', () => {
      // Add a small delay before resetting the flag to ensure
      // the main touchend handler processes with the correct flag value
      setTimeout(() => {
        isScrollingTable = false;
      }, 50);
    }, false);
  });
  
  document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, false);
  
  document.addEventListener('touchend', e => {
    // If we're inside a table container, don't process swipe for navigation
    if (isScrollingTable) {
      return;
    }
    
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  }, false);
  
  function handleSwipe() {
    // Increase threshold to make swiping less sensitive
    const swipeThreshold = 200;
    
    // Calculate horizontal and vertical movement
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Only process horizontal swipes if horizontal movement is greater than vertical
    // This avoids triggering navigation when user is trying to scroll vertically
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < -swipeThreshold) {
        // Swipe left - go to next tab
        const activeTab = document.querySelector('nav a.active');
        const allTabs = Array.from(document.querySelectorAll('nav a'));
        const currentIndex = allTabs.indexOf(activeTab);
        
        if (currentIndex < allTabs.length - 1) {
          allTabs[currentIndex + 1].click();
        }
      }
      
      if (deltaX > swipeThreshold) {
        // Swipe right - go to previous tab
        const activeTab = document.querySelector('nav a.active');
        const allTabs = Array.from(document.querySelectorAll('nav a'));
        const currentIndex = allTabs.indexOf(activeTab);
        
        if (currentIndex > 0) {
          allTabs[currentIndex - 1].click();
        }
      }
    }
  }
  
  // Add helper class to all tables for automatic overflow handling
  const tables = document.querySelectorAll('table');
  tables.forEach(table => {
    // Avoid double-wrapping if already in a wrapper
    if (!table.parentNode.classList.contains('table-responsive')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-responsive';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });
  
  // Handle table scroll indicators
  const tableResponsiveContainers = document.querySelectorAll('.table-responsive');
  tableResponsiveContainers.forEach(container => {
    container.addEventListener('scroll', function() {
      // Add a class once the user has scrolled the table
      if (this.scrollLeft > 5) {
        this.classList.add('scrolled-table');
      }
    });
  });
});