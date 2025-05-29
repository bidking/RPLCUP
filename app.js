document.addEventListener("DOMContentLoaded", () => {
    // === RESET DATA FUNCTIONALITY ===
    const resetDataBtn = document.getElementById("reset-data");
    resetDataBtn.addEventListener("click", () => {
        const ok = window.confirm("Apakah benar ingin mereset data? Dengan mereset data, semua data skor klasemen akan dihitung ulang");
        if (ok) {
            localStorage.removeItem("tournamentData");
            window.location.reload();
        }
    });

    // === TOURNAMENT DATA STRUCTURE ===
    const tournamentData = {
        teams: {
            groupA: [
                { name: "12 RPL 2", id: "12rpl2" },
                { name: "11 RPL 2", id: "11rpl2" },
                { name: "ALUMNI 17", id: "alumni17" },
                { name: "11 RPL 1", id: "11rpl1" },
                { name: "ALUMNI 22", id: "alumni22" }
            ],
            groupB: [
                { name: "10 RPL 2", id: "10rpl2" },
                { name: "ALUMNI 23", id: "alumni23" },
                { name: "12 RPL 1", id: "12rpl1" },
                { name: "ALUMNI 21", id: "alumni21" },
                { name: "ALUMNI 18", id: "alumni18" }
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
        },
        timer: {
            currentTime: 15 * 60, // 15 menit dalam detik
            defaultTime: 15 * 60,
            isRunning: false,
            interval: null
        }
    };

    // === LOCAL STORAGE MANAGEMENT ===
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

    // === INITIALIZE MATCHES ===
    function initializeMatches() {
        let matchId = 1;
        
        // Sistem kiri-kanan: 20 pertandingan grup berdasarkan foto
        const matchSchedule = [
            // Match 1 (Grup A - Kiri): 12 RPL 2 vs 11 RPL 2
            { group: 'groupA', teamA: null, teamB: null },
            // Match 2 (Grup B - Kanan): 10 RPL 2 vs ALUMNI 23
            { group: 'groupB', teamA: null, teamB: null },
            // Match 3 (Grup A - Kiri): ALUMNI 17 vs 11 RPL 1
            { group: 'groupA', teamA: null, teamB: null },
            // Match 4 (Grup B - Kanan): 12 RPL 1 vs ALUMNI 21
            { group: 'groupB', teamA: null, teamB: null },
            // Match 5 (Grup A - Kiri): ALUMNI 22 vs 12 RPL 2
            { group: 'groupA', teamA: null, teamB: null },
            // Match 6 (Grup B - Kanan): ALUMNI 18 vs 10 RPL 2
            { group: 'groupB', teamA: null, teamB: null },
            // Match 7 (Grup A - Kiri): 11 RPL 2 vs ALUMNI 17
            { group: 'groupA', teamA: null, teamB: null },
            // Match 8 (Grup B - Kanan): ALUMNI 23 vs 12 RPL 1
            { group: 'groupB', teamA: null, teamB: null },
            // Match 9 (Grup A - Kiri): 11 RPL 1 vs ALUMNI 22
            { group: 'groupA', teamA: null, teamB: null },
            // Match 10 (Grup B - Kanan): ALUMNI 21 vs ALUMNI 18
            { group: 'groupB', teamA: null, teamB: null },
            // Match 11 (Grup A - Kiri): 12 RPL 2 vs ALUMNI 17
            { group: 'groupA', teamA: null, teamB: null },
            // Match 12 (Grup B - Kanan): 10 RPL 2 vs 12 RPL 1
            { group: 'groupB', teamA: null, teamB: null },
            // Match 13 (Grup A - Kiri): 11 RPL 2 vs ALUMNI 22
            { group: 'groupA', teamA: null, teamB: null },
            // Match 14 (Grup B - Kanan): ALUMNI 23 vs ALUMNI 21
            { group: 'groupB', teamA: null, teamB: null },
            // Match 15 (Grup A - Kiri): 11 RPL 1 vs 12 RPL 2
            { group: 'groupA', teamA: null, teamB: null },
            // Match 16 (Grup B - Kanan): ALUMNI 18 vs 12 RPL 1
            { group: 'groupB', teamA: null, teamB: null },
            // Match 17 (Grup A - Kiri): ALUMNI 17 vs ALUMNI 22
            { group: 'groupA', teamA: null, teamB: null },
            // Match 18 (Grup B - Kanan): 10 RPL 2 vs ALUMNI 21
            { group: 'groupB', teamA: null, teamB: null },
            // Match 19 (Grup A - Kiri): 11 RPL 2 vs 11 RPL 1
            { group: 'groupA', teamA: null, teamB: null },
            // Match 20 (Grup B - Kanan): ALUMNI 23 vs ALUMNI 18
            { group: 'groupB', teamA: null, teamB: null }
        ];

        // Buat pertandingan grup berdasarkan jadwal
        matchSchedule.forEach(matchInfo => {
            const match = {
                id: matchId++,
                teamA: matchInfo.teamA,
                teamB: matchInfo.teamB,
                group: matchInfo.group,
                scoreA: 0,
                scoreB: 0,
                completed: false,
                stage: 'group',
                matchTime: 15 * 60 // 15 menit dalam detik
            };
            tournamentData.matches.push(match);
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
                completed: false,
                matchTime: 15 * 60
            },
            {
                id: matchId++,
                stage: 'semifinal2',
                teamA: null,
                teamB: null,
                scoreA: 0,
                scoreB: 0,
                completed: false,
                matchTime: 15 * 60
            },
            {
                id: matchId++,
                stage: 'thirdPlace',
                teamA: null,
                teamB: null,
                scoreA: 0,
                scoreB: 0,
                completed: false,
                matchTime: 15 * 60
            },
            {
                id: matchId++,
                stage: 'final',
                teamA: null,
                teamB: null,
                scoreA: 0,
                scoreB: 0,
                completed: false,
                matchTime: 15 * 60
            }
        ];

        tournamentData.matches.push(...knockoutMatches);
        saveToLocalStorage();
    }

    // === TIMER FUNCTIONS ===
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = formatTime(tournamentData.timer.currentTime);
        }
    }

    function startTimer() {
        if (tournamentData.timer.isRunning) return;
        
        tournamentData.timer.isRunning = true;
        tournamentData.timer.interval = setInterval(() => {
            if (tournamentData.timer.currentTime > 0) {
                tournamentData.timer.currentTime--;
                updateTimerDisplay();
                saveToLocalStorage();
            } else {
                stopTimer();
                showNotification("Waktu habis!");
            }
        }, 1000);
        
        // Update button states
        const startBtn = document.getElementById('start-timer');
        const pauseBtn = document.getElementById('pause-timer');
        if (startBtn) startBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = false;
        
        document.querySelectorAll('.goal-btn').forEach(btn => btn.disabled = false);
        
        saveToLocalStorage();
    }

    function pauseTimer() {
        if (!tournamentData.timer.isRunning) return;
        
        tournamentData.timer.isRunning = false;
        if (tournamentData.timer.interval) {
            clearInterval(tournamentData.timer.interval);
            tournamentData.timer.interval = null;
        }
        
        // Update button states
        const startBtn = document.getElementById('start-timer');
        const pauseBtn = document.getElementById('pause-timer');
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        
        document.querySelectorAll('.goal-btn').forEach(btn => btn.disabled = true);
        
        saveToLocalStorage();
    }

    function stopTimer() {
        pauseTimer();
        tournamentData.timer.currentTime = tournamentData.timer.defaultTime;
        updateTimerDisplay();
        saveToLocalStorage();
    }

    function addOneMinute() {
        tournamentData.timer.currentTime += 60;
        updateTimerDisplay();
        saveToLocalStorage();
    }

    function setCustomTime() {
        const customTimeInput = document.getElementById('custom-time');
        if (customTimeInput) {
            const customMinutes = parseInt(customTimeInput.value);
            if (customMinutes && customMinutes > 0) {
                tournamentData.timer.currentTime = customMinutes * 60;
                tournamentData.timer.defaultTime = customMinutes * 60;
                updateTimerDisplay();
                saveToLocalStorage();
                showNotification(`Waktu diatur ke ${customMinutes} menit`);
            }
        }
    }

    // === GROUP STAGE CALCULATIONS ===
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
            .filter(match => match.group === group && match.completed && match.teamA && match.teamB)
            .forEach(match => {
                const teamAIndex = standings.findIndex(t => t.id === match.teamA.id);
                const teamBIndex = standings.findIndex(t => t.id === match.teamB.id);

                if (teamAIndex !== -1 && teamBIndex !== -1) {
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
                }
            });

        // Sort standings
        standings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const goalDiffB = b.goalsFor - b.goalsAgainst;
            const goalDiffA = a.goalsFor - a.goalsAgainst;
            if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
            return b.goalsFor - a.goalsFor;
        });

        tournamentData.groupStandings[group] = standings;
        saveToLocalStorage();
        return standings;
    }

    // === RENDER GROUP STAGES ===
    function renderGroupStages() {
        const groups = ['A', 'B'];
        groups.forEach(group => {
            const tableBody = document.getElementById(`group-${group}-table`);
            if (tableBody) {
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
            }
        });
    }

    // === TEAM SETUP FUNCTIONS ===
    function renderTeamSetup() {
        const groups = ['A', 'B'];
        groups.forEach(group => {
            const setupTable = document.getElementById(`setup-matches-${group}`);
            if (setupTable) {
                const groupMatches = tournamentData.matches.filter(m => 
                    m.group === `group${group}` && m.stage === 'group'
                );
                
                setupTable.innerHTML = groupMatches.map(match => `
                    <tr>
                        <td>Game ${match.id}</td>
                        <td>
                            <button class="team-select-btn" data-match-id="${match.id}" data-position="A">
                                ${match.teamA ? match.teamA.name : 'Pilih Tim A'}
                            </button>
                        </td>
                        <td>VS</td>
                        <td>
                            <button class="team-select-btn" data-match-id="${match.id}" data-position="B">
                                ${match.teamB ? match.teamB.name : 'Pilih Tim B'}
                            </button>
                        </td>
                        <td>
                            <button class="reset-match-btn" data-match-id="${match.id}">Reset</button>
                        </td>
                    </tr>
                `).join('');
            }
        });
        
        // Add event listeners for team selection buttons
        document.querySelectorAll('.team-select-btn').forEach(btn => {
            btn.addEventListener('click', handleTeamSelection);
        });
        
        // Add event listeners for reset match buttons
        document.querySelectorAll('.reset-match-btn').forEach(btn => {
            btn.addEventListener('click', handleMatchReset);
        });
    }

    function handleTeamSelection(e) {
        const matchId = parseInt(e.target.getAttribute('data-match-id'));
        const position = e.target.getAttribute('data-position');
        const match = tournamentData.matches.find(m => m.id === matchId);
        
        if (match) {
            openTeamSelectionModal(matchId, position, match.group);
        }
    }

    function handleMatchReset(e) {
        const matchId = parseInt(e.target.getAttribute('data-match-id'));
        const match = tournamentData.matches.find(m => m.id === matchId);
        
        if (match) {
            match.teamA = null;
            match.teamB = null;
            match.scoreA = 0;
            match.scoreB = 0;
            match.completed = false;
            saveToLocalStorage();
            renderTeamSetup();
            renderGroupStages();
            showNotification(`Match ${matchId} telah direset`);
        }
    }

    function openTeamSelectionModal(matchId, position, group) {
        const modal = document.getElementById('team-selection-modal');
        const matchIdInput = document.getElementById('current-match-id');
        const positionInput = document.getElementById('current-team-position');
        const teamsList = document.getElementById('teams-list');
        const title = document.getElementById('team-selection-title');
        
        if (modal && matchIdInput && positionInput && teamsList && title) {
            matchIdInput.value = matchId;
            positionInput.value = position;
            title.textContent = `Pilih Tim ${position}`;
            
            // Populate teams list
            const teams = tournamentData.teams[group];
            teamsList.innerHTML = teams.map(team => `
                <div class="team-option" data-team-id="${team.id}">
                    <input type="radio" name="selected-team" value="${team.id}" id="team-${team.id}">
                    <label for="team-${team.id}">${team.name}</label>
                </div>
            `).join('');
            
            modal.style.display = 'block';
        }
    }

    // === KNOCKOUT STAGE FUNCTIONS ===
    function areAllGroupMatchesCompleted() {
        const groupMatches = tournamentData.matches.filter(m => m.stage === 'group');
        return groupMatches.every(m => m.completed && m.teamA && m.teamB);
    }

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

        const semifinal1Match = tournamentData.matches.find(m => m.stage === 'semifinal1');
        const semifinal2Match = tournamentData.matches.find(m => m.stage === 'semifinal2');

        semifinal1Match.teamA = groupAStandings[0];
        semifinal1Match.teamB = groupBStandings[1];
        semifinal2Match.teamA = groupBStandings[0];
        semifinal2Match.teamB = groupAStandings[1];

        saveToLocalStorage();
        updateKnockoutStageUI();
        return true;
    }

    function updateKnockoutStageUI() {
        const knockout = tournamentData.matches.filter(m => 
            ['semifinal1', 'semifinal2', 'thirdPlace', 'final'].includes(m.stage)
        );

        // Update UI for each stage
        ['semifinal-1', 'semifinal-2', 'final', 'third-place'].forEach((elementId, index) => {
            const element = document.getElementById(elementId);
            const match = knockout[index];
            
            if (element && match) {
                const team1 = element.querySelector('.bracket-team:first-child');
                const team2 = element.querySelector('.bracket-team:last-child');
                
                if (team1 && team2) {
                    team1.querySelector('.team-name').textContent = match.teamA ? match.teamA.name : 'TBD';
                    team2.querySelector('.team-name').textContent = match.teamB ? match.teamB.name : 'TBD';
                    team1.setAttribute('data-team-id', match.teamA ? match.teamA.id : '');
                    team2.setAttribute('data-team-id', match.teamB ? match.teamB.id : '');
                    element.setAttribute('data-match-id', match.id);
                }
            }
        });
    }

    function updateKnockoutStageMatches() {
        const semifinal1 = tournamentData.matches.find(m => m.stage === 'semifinal1');
        const semifinal2 = tournamentData.matches.find(m => m.stage === 'semifinal2');
        const thirdPlaceMatch = tournamentData.matches.find(m => m.stage === 'thirdPlace');
        const finalMatch = tournamentData.matches.find(m => m.stage === 'final');

        if (semifinal1.completed && 
            semifinal2.completed) {
            const sf1Winner = semifinal1.scoreA > semifinal1.scoreB ? semifinal1.teamA : semifinal1.teamB;
            const sf2Winner = semifinal2.scoreA > semifinal2.scoreB ? semifinal2.teamA : semifinal2.teamB;
            const sf1Loser = semifinal1.scoreA > semifinal1.scoreB ? semifinal1.teamB : semifinal1.teamA;
            const sf2Loser = semifinal2.scoreA > semifinal2.scoreB ? semifinal2.teamB : semifinal2.teamA;

            finalMatch.teamA = sf1Winner;
            finalMatch.teamB = sf2Winner;
            thirdPlaceMatch.teamA = sf1Loser;
            thirdPlaceMatch.teamB = sf2Loser;

            saveToLocalStorage();
            updateKnockoutStageUI();
        }

        if (finalMatch.completed || thirdPlaceMatch.completed) {
            updatePodiumUI();
        }
    }

    function updatePodiumUI() {
        const finalMatch = tournamentData.matches.find(m => m.stage === 'final');
        const thirdPlaceMatch = tournamentData.matches.find(m => m.stage === 'thirdPlace');

        if (finalMatch.completed) {
            const champion = finalMatch.scoreA > finalMatch.scoreB ? finalMatch.teamA : finalMatch.teamB;
            const runnerUp = finalMatch.scoreA > finalMatch.scoreB ? finalMatch.teamB : finalMatch.teamA;

            const championElement = document.getElementById('champion');
            const runnerUpElement = document.getElementById('runner-up');
            
            if (championElement) championElement.textContent = champion.name;
            if (runnerUpElement) runnerUpElement.textContent = runnerUp.name;
            
            tournamentData.knockoutStage.podium.champion = champion;
            tournamentData.knockoutStage.podium.runnerUp = runnerUp;
        }

        if (thirdPlaceMatch.completed) {
            const thirdPlace = thirdPlaceMatch.scoreA > thirdPlaceMatch.scoreB 
                ? thirdPlaceMatch.teamA 
                : thirdPlaceMatch.teamB;

            const thirdPlaceElement = document.getElementById('third-place-winner');
            if (thirdPlaceElement) thirdPlaceElement.textContent = thirdPlace.name;
            
            tournamentData.knockoutStage.podium.thirdPlace = thirdPlace;
        }
        
        saveToLocalStorage();
    }

    // === NAVIGATION SETUP ===
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
            
            if (sectionId === "group-stage") {
                renderGroupStages();
            }
            
            if (sectionId === "team-setup") {
                renderTeamSetup();
            }
            
            if (sectionId === "knockout") {
                if (areAllGroupMatchesCompleted()) {
                    prepareKnockoutStage();
                }
            }
        });
    });

    // === GROUP TABS ===
    const tabButtons = document.querySelectorAll(".tab-btn");
    const groupTables = document.querySelectorAll(".group-table");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            groupTables.forEach(table => table.classList.remove("active"));

            btn.classList.add("active");
            const group = btn.getAttribute("data-group");
            const groupElement = document.getElementById(`group-${group}`);
            if (groupElement) groupElement.classList.add("active");
        });
    });

    // Setup tabs for team setup section
    const setupTabButtons = document.querySelectorAll(".setup-tab-btn");
    const setupGroups = document.querySelectorAll(".setup-group");

    setupTabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            setupTabButtons.forEach(b => b.classList.remove("active"));
            setupGroups.forEach(group => group.classList.remove("active"));

            btn.classList.add("active");
            const group = btn.getAttribute("data-setup-group");
            const groupElement = document.getElementById(`setup-group-${group}`);
            if (groupElement) groupElement.classList.add("active");
        });
    });

    // === MATCH MANAGEMENT ===
    let currentMatchIndex = 0;
    const scoreAInput = document.getElementById("score-a");
    const scoreBInput = document.getElementById("score-b");

    function updateMatchDisplay() {
        const matches = tournamentData.matches;
        if (matches.length === 0 || currentMatchIndex >= matches.length) {
            return;
        }
        
        const match = matches[currentMatchIndex];
        
        const matchIdElement = document.querySelector(".match-id");
        const matchStageElement = document.querySelector(".match-stage");
        const teamANameElement = document.querySelector(".team-a .team-name");
        const teamBNameElement = document.querySelector(".team-b .team-name");
        const currentMatchDisplayElement = document.getElementById("current-match-display");
        
        if (matchIdElement) matchIdElement.textContent = `Game ${match.id}`;
        if (matchStageElement) {
            matchStageElement.textContent = match.stage === 'group' ? 
                `Grup ${match.group?.replace('group', '')}` : 
                formatStageName(match.stage);
        }
        
        if (teamANameElement) teamANameElement.textContent = match.teamA ? match.teamA.name : 'Belum dipilih';
        if (teamBNameElement) teamBNameElement.textContent = match.teamB ? match.teamB.name : 'Belum dipilih';
        if (currentMatchDisplayElement) currentMatchDisplayElement.textContent = `Game ${match.id}`;
        
        if (scoreAInput) scoreAInput.value = match.scoreA;
        if (scoreBInput) scoreBInput.value = match.scoreB;

        // Update timer
        if (match.matchTime) {
            tournamentData.timer.currentTime = match.matchTime;
            tournamentData.timer.defaultTime = match.matchTime;
        }
        updateTimerDisplay();

        // Update UI states
        const inputsDisabled = !match.teamA || !match.teamB;
        if (scoreAInput) scoreAInput.disabled = inputsDisabled;
        if (scoreBInput) scoreBInput.disabled = inputsDisabled;
        
        document.querySelectorAll(".goal-btn").forEach(btn => {
            btn.disabled = inputsDisabled || !tournamentData.timer.isRunning;
        });
        
        const submitScoreBtn = document.getElementById("submit-score");
        if (submitScoreBtn) {
            submitScoreBtn.disabled = inputsDisabled;
        }

        // Add timer controls to match display
        addTimerControls();
    }

    function addTimerControls() {
        const matchCard = document.querySelector('.match-card');
        const existingTimer = document.getElementById('timer-controls');
        
        if (existingTimer) {
            existingTimer.remove();
        }
        
        const timerControls = document.createElement('div');
        timerControls.id = 'timer-controls';
        timerControls.innerHTML = `
            <div class="timer-display">
                <h4>Waktu Pertandingan</h4>
                <div id="timer-display" class="timer-time">${formatTime(tournamentData.timer.currentTime)}</div>
                <div class="timer-buttons">
                    <button id="start-timer" class="primary-btn" ${tournamentData.timer.isRunning ? 'disabled' : ''}>
                        <i class="fas fa-play"></i> Start
                    </button>
                    <button id="pause-timer" class="secondary-btn" ${!tournamentData.timer.isRunning ? 'disabled' : ''}>
                        <i class="fas fa-pause"></i> Pause
                    </button>
                    <button id="stop-timer" class="secondary-btn">
                        <i class="fas fa-stop"></i> Stop
                    </button>
                 <button id="add-minute" class="secondary-btn">
                        <i class="fas fa-plus"></i> +1 Menit
                    </button>
                </div>
                <div class="custom-time-input">
                    <input type="number" id="custom-time" min="1" max="90" placeholder="Menit" value="15">
                    <button id="set-custom-time" class="secondary-btn">Set Waktu</button>
                </div>
            </div>
        `;
        
        const matchHeader = matchCard.querySelector('.match-header');
        matchHeader.insertAdjacentElement('afterend', timerControls);
        
        // Add event listeners for timer controls
        document.getElementById('start-timer').addEventListener('click', startTimer);
        document.getElementById('pause-timer').addEventListener('click', pauseTimer);
        document.getElementById('stop-timer').addEventListener('click', stopTimer);
        document.getElementById('add-minute').addEventListener('click', addOneMinute);
        document.getElementById('set-custom-time').addEventListener('click', setCustomTime);
    }

    function formatStageName(stage) {
        const stageNames = {
            'group': 'Grup Stage',
            'semifinal1': 'Semifinal 1',
            'semifinal2': 'Semifinal 2',
            'thirdPlace': 'Perebutan Juara 3',
            'final': 'Final'
        };
        return stageNames[stage] || stage;
    }

    function renderAllMatches() {
        const allMatchesList = document.getElementById("all-matches");
        if (allMatchesList) {
            allMatchesList.innerHTML = tournamentData.matches.map(match => {
                const status = match.completed ? 
                    `<span class="match-completed">${match.scoreA} - ${match.scoreB}</span>` :
                    `<span class="match-pending">Belum selesai</span>`;
                
                const teamAName = match.teamA ? match.teamA.name : 'Belum dipilih';
                const teamBName = match.teamB ? match.teamB.name : 'Belum dipilih';
                
                return `
                    <li class="match-item" data-match-id="${match.id}">
                        <div class="match-info">
                            <span class="match-title">Game ${match.id}</span>
                            <span class="match-teams">${teamAName} vs ${teamBName}</span>
                        </div>
                        <div class="match-status">${status}</div>
                    </li>
                `;
            }).join('');
        }
    }

    // === GOAL BUTTON HANDLERS ===
    document.querySelectorAll(".goal-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            if (!tournamentData.timer.isRunning) {
                showNotification("Timer harus berjalan untuk bisa menambah gol!", true);
                return;
            }
            
            const team = e.target.getAttribute("data-team");
            const match = tournamentData.matches[currentMatchIndex];
            
            if (team === "a") {
                match.scoreA++;
                if (scoreAInput) scoreAInput.value = match.scoreA;
            } else {
                match.scoreB++;
                if (scoreBInput) scoreBInput.value = match.scoreB;
            }
            
            saveToLocalStorage();
        });
    });

    // === SCORE INPUT HANDLERS ===
    if (scoreAInput) {
        scoreAInput.addEventListener("input", e => {
            const match = tournamentData.matches[currentMatchIndex];
            match.scoreA = parseInt(e.target.value) || 0;
            saveToLocalStorage();
        });
    }

    if (scoreBInput) {
        scoreBInput.addEventListener("input", e => {
            const match = tournamentData.matches[currentMatchIndex];
            match.scoreB = parseInt(e.target.value) || 0;
            saveToLocalStorage();
        });
    }

    // === MATCH NAVIGATION ===
    const prevMatchBtn = document.getElementById("prev-match");
    const nextMatchBtn = document.getElementById("next-match");

    if (prevMatchBtn) {
        prevMatchBtn.addEventListener("click", () => {
            if (currentMatchIndex > 0) {
                currentMatchIndex--;
                updateMatchDisplay();
                renderAllMatches();
            }
        });
    }

    if (nextMatchBtn) {
        nextMatchBtn.addEventListener("click", () => {
            if (currentMatchIndex < tournamentData.matches.length - 1) {
                currentMatchIndex++;
                updateMatchDisplay();
                renderAllMatches();
            }
        });
    }

    // === SUBMIT SCORE ===
    const submitScoreBtn = document.getElementById("submit-score");
    const resetScoreBtn = document.getElementById("reset-score");

    if (submitScoreBtn) {
        submitScoreBtn.addEventListener("click", () => {
            const match = tournamentData.matches[currentMatchIndex];
            
            if (!match.teamA || !match.teamB) {
                showNotification("Pilih tim terlebih dahulu!", true);
                return;
            }
            
            match.completed = true;
            match.scoreA = parseInt(scoreAInput?.value) || 0;
            match.scoreB = parseInt(scoreBInput?.value) || 0;
            
            saveToLocalStorage();
            renderGroupStages();
            renderAllMatches();
            
            // Update knockout stage if needed
            if (match.stage !== 'group') {
                updateKnockoutStageMatches();
            }
            
            showNotification(`Skor Game ${match.id} berhasil disimpan!`);
            
            // Stop timer
            stopTimer();
        });
    }

    if (resetScoreBtn) {
        resetScoreBtn.addEventListener("click", () => {
            const match = tournamentData.matches[currentMatchIndex];
            match.scoreA = 0;
            match.scoreB = 0;
            match.completed = false;
            
            if (scoreAInput) scoreAInput.value = 0;
            if (scoreBInput) scoreBInput.value = 0;
            
            saveToLocalStorage();
            renderGroupStages();
            renderAllMatches();
            showNotification(`Skor Game ${match.id} telah direset!`);
        });
    }

    // === TEAM SELECTION MODAL ===
    const modal = document.getElementById('team-selection-modal');
    const closeModal = document.querySelector('.close-modal');
    const confirmBtn = document.getElementById('select-team-confirm');
    const cancelBtn = document.getElementById('select-team-cancel');

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const selectedTeam = document.querySelector('input[name="selected-team"]:checked');
            if (selectedTeam) {
                const matchId = parseInt(document.getElementById('current-match-id').value);
                const position = document.getElementById('current-team-position').value;
                const match = tournamentData.matches.find(m => m.id === matchId);
                
                if (match) {
                    const teamId = selectedTeam.value;
                    const team = tournamentData.teams.groupA.find(t => t.id === teamId) || 
                                tournamentData.teams.groupB.find(t => t.id === teamId);
                    
                    if (position === 'A') {
                        match.teamA = team;
                    } else {
                        match.teamB = team;
                    }
                    
                    saveToLocalStorage();
                    renderTeamSetup();
                    updateMatchDisplay();
                    showNotification(`Tim ${team.name} berhasil dipilih untuk Game ${matchId}`);
                }
            }
            modal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // === NOTIFICATION SYSTEM ===
    function showNotification(message, isError = false) {
        const notification = document.getElementById("notification");
        const notificationMessage = document.querySelector(".notification-message");
        const notificationClose = document.querySelector(".notification-close");
        
        if (notification && notificationMessage) {
            notificationMessage.textContent = message;
            notification.classList.toggle("error", isError);
            notification.classList.add("show");
            
            // Auto hide after 3 seconds
            setTimeout(() => {
                notification.classList.remove("show");
            }, 3000);
        }
        
        if (notificationClose) {
            notificationClose.addEventListener("click", () => {
                notification.classList.remove("show");
            });
        }
    }

    // === BRACKET CLICK HANDLERS ===
    document.addEventListener('click', (e) => {
        if (e.target.closest('.bracket-match')) {
            const bracketMatch = e.target.closest('.bracket-match');
            const matchId = bracketMatch.getAttribute('data-match-id');
            
            if (matchId) {
                const match = tournamentData.matches.find(m => m.id === parseInt(matchId));
                if (match && match.teamA && match.teamB) {
                    currentMatchIndex = tournamentData.matches.findIndex(m => m.id === parseInt(matchId));
                    
                    // Switch to schedule section
                    document.querySelector('nav a[data-section="schedule"]').click();
                    updateMatchDisplay();
                }
            }
        }
    });

    // === INITIALIZATION ===
    function initialize() {
        loadFromLocalStorage();
        
        if (tournamentData.matches.length === 0) {
            initializeMatches();
        }
        
        updateMatchDisplay();
        renderGroupStages();
        renderTeamSetup();
        renderAllMatches();
        updateTimerDisplay();
        
        // Auto-prepare knockout stage if all group matches are completed
        if (areAllGroupMatchesCompleted()) {
            prepareKnockoutStage();
        }
    }

    // Start the application
    initialize();
    
});
