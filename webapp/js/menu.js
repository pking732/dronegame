// ============================================
// Menu — Main menu and Game Over screen logic
// ============================================

const Menu = (() => {
    function showMenu() {
        document.getElementById('menu-screen').classList.add('active');
        document.getElementById('gameover-screen').classList.remove('active');
        Social.hideAllSocial();
        Social.setActiveNav('home');
        document.getElementById('bottom-nav').classList.add('visible');
    }

    function hideMenu() {
        document.getElementById('menu-screen').classList.remove('active');
    }

    function showGameOver(result, playerData) {
        const isNewBest = result.score > (playerData.best_score || 0);

        document.getElementById('result-hits').textContent = result.hits;
        document.getElementById('result-level').textContent = result.level;
        document.getElementById('result-score').textContent = result.score;

        const newBestRow = document.getElementById('new-best-row');
        newBestRow.style.display = isNewBest ? 'flex' : 'none';

        document.getElementById('gameover-screen').classList.add('active');
        // Hide nav during game over
        document.getElementById('bottom-nav').classList.remove('visible');

        return isNewBest;
    }

    function hideGameOver() {
        document.getElementById('gameover-screen').classList.remove('active');
    }

    function updatePlayerInfo(playerData) {
        const nameEl = document.getElementById('player-name');
        const avatarEl = document.getElementById('player-avatar');
        const totalEl = document.getElementById('total-score');
        const bestEl = document.getElementById('best-score');
        const gamesEl = document.getElementById('games-played');

        const name = playerData.username || playerData.first_name || 'Player';
        nameEl.textContent = name;
        avatarEl.textContent = name.charAt(0).toUpperCase();
        totalEl.textContent = formatNumber(playerData.total_score || 0);
        bestEl.textContent = formatNumber(playerData.best_score || 0);
        gamesEl.textContent = playerData.games_played || 0;

        // Update league badge
        const league = playerData.league || API.calculateLeague(playerData.total_score || 0);
        const leagueInfo = API.getLeagueInfo(league);
        const leagueIconEl = document.getElementById('league-icon');
        const leagueNameEl = document.getElementById('league-name');
        if (leagueIconEl) leagueIconEl.textContent = leagueInfo.icon;
        if (leagueNameEl) {
            leagueNameEl.textContent = leagueInfo.name;
            leagueNameEl.style.color = leagueInfo.color;
        }
    }

    function formatNumber(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return String(n);
    }

    return { showMenu, hideMenu, showGameOver, hideGameOver, updatePlayerInfo };
})();
