// ============================================
// App — Main application entry point
// ============================================

const App = (() => {
    let playerData = {
        id: 0,
        username: 'Player',
        first_name: 'Player',
        total_score: 0,
        best_score: 0,
        games_played: 0,
        league: 'bronze',
        referral_code: ''
    };

    let telegramUser = null;

    async function init() {
        let referredBy = null;

        // Initialize Telegram WebApp
        try {
            if (window.Telegram && Telegram.WebApp) {
                Telegram.WebApp.ready();
                Telegram.WebApp.expand();

                // Set header color to match theme
                try {
                    Telegram.WebApp.setHeaderColor('#0a0e0a');
                    Telegram.WebApp.setBackgroundColor('#0a0e0a');
                } catch (_) { }

                // Get user data
                const initData = Telegram.WebApp.initDataUnsafe;
                if (initData && initData.user) {
                    telegramUser = initData.user;
                }

                // Check referral start_param
                if (initData && initData.start_param) {
                    const refCode = initData.start_param;
                    const referrer = await API.getPlayerByReferralCode(refCode);
                    if (referrer) {
                        referredBy = referrer.id;
                    }
                }
            }
        } catch (e) {
            console.warn('Not running in Telegram context:', e);
        }

        // Fallback for dev/browser mode
        if (!telegramUser) {
            telegramUser = {
                id: 12345678,
                username: 'dev_player',
                first_name: 'Developer'
            };
        }

        // Load player data from Supabase
        playerData = await API.getOrCreatePlayer(
            telegramUser.id,
            telegramUser.username,
            telegramUser.first_name,
            referredBy
        );

        // Update menu
        Menu.updatePlayerInfo(playerData);
        Menu.showMenu();

        // Initialize Social module
        Social.init(playerData.id, playerData);

        // Update unread badge periodically
        Social.updateUnreadBadge();
        setInterval(() => Social.updateUnreadBadge(), 15000);

        // Bind buttons
        document.getElementById('play-btn').addEventListener('click', startGame);
        document.getElementById('retry-btn').addEventListener('click', startGame);
        document.getElementById('menu-btn').addEventListener('click', () => {
            Menu.hideGameOver();
            Menu.showMenu();
        });
    }

    function startGame() {
        Menu.hideMenu();
        Menu.hideGameOver();
        Social.hideAllSocial();
        // Hide nav during game
        document.getElementById('bottom-nav').classList.remove('visible');
        Game.start(onGameOver);
    }

    async function onGameOver(result) {
        // Update local player data
        playerData.total_score += result.score;
        playerData.games_played += 1;

        const isNewBest = result.score > playerData.best_score;
        if (isNewBest) {
            playerData.best_score = result.score;
        }

        // Recalculate league
        playerData.league = API.calculateLeague(playerData.total_score);

        // Show game over screen
        Menu.showGameOver(result, { best_score: isNewBest ? 0 : playerData.best_score });

        // Save to Supabase (async, don't block UI)
        API.saveScore(
            playerData.id,
            result.score,
            playerData.total_score,
            playerData.best_score,
            playerData.games_played
        ).then(() => {
            // Update menu info in background
            Menu.updatePlayerInfo(playerData);
        });
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init };
})();
