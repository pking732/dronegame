// ============================================
// Social — Leaderboard, Friends, Chat, Referral screens
// ============================================

const Social = (() => {
    let currentPlayerId = null;
    let currentPlayerData = null;
    let activeTab = 'leaderboard';
    let activeLeague = 'bronze';
    let activeChatFriend = null;
    let chatPollInterval = null;

    function init(playerId, playerData) {
        currentPlayerId = playerId;
        currentPlayerData = playerData;
        activeLeague = playerData.league || 'bronze';
        bindNavigation();
    }

    function bindNavigation() {
        // Use event delegation on the nav container for maximum reliability
        const nav = document.getElementById('bottom-nav');
        if (nav) {
            nav.addEventListener('click', (e) => {
                const item = e.target.closest('.nav-item');
                if (!item) return;
                const tab = item.dataset.tab;
                if (!tab) return;
                if (tab === 'home') {
                    hideAllSocial();
                    Menu.showMenu();
                    setActiveNav('home');
                    return;
                }
                showTab(tab);
            });
        }
    }

    function setActiveNav(tab) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });
    }

    function showTab(tab) {
        activeTab = tab;
        Menu.hideMenu();
        Menu.hideGameOver();
        hideAllSocial();
        setActiveNav(tab);

        const screen = document.getElementById(`${tab}-screen`);
        if (screen) {
            screen.classList.add('active');
        }

        if (tab === 'leaderboard') loadLeaderboard();
        if (tab === 'friends') loadFriends();
        if (tab === 'chat') loadChatList();
        if (tab === 'referral') loadReferral();

        // Show bottom nav
        document.getElementById('bottom-nav').classList.add('visible');
    }

    function hideAllSocial() {
        ['leaderboard-screen', 'friends-screen', 'chat-screen', 'referral-screen', 'chat-dialog-screen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
        if (chatPollInterval) {
            clearInterval(chatPollInterval);
            chatPollInterval = null;
        }
    }

    // ============ LEADERBOARD ============
    async function loadLeaderboard() {
        const container = document.getElementById('leaderboard-list');
        container.innerHTML = '<div class="loading-text">Загрузка...</div>';

        // Set active league tab
        document.querySelectorAll('.league-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.league === activeLeague);
        });

        // Bind league tabs
        document.querySelectorAll('.league-tab').forEach(t => {
            t.onclick = () => {
                activeLeague = t.dataset.league;
                loadLeaderboard();
            };
        });

        const players = await API.getLeaderboard(activeLeague);
        const leagueInfo = API.getLeagueInfo(activeLeague);

        if (!players.length) {
            container.innerHTML = '<div class="empty-text">Пока нет игроков в этой лиге</div>';
            return;
        }

        container.innerHTML = players.map((p, i) => {
            const rankIcons = ['👑', '🥈', '🥉'];
            const rank = i < 3 ? rankIcons[i] : `${i + 1}`;
            const isMe = p.id === currentPlayerId;
            const name = p.username || p.first_name || 'Player';
            return `
        <div class="lb-row ${isMe ? 'lb-me' : ''}" style="animation-delay:${i * 0.05}s">
          <span class="lb-rank">${rank}</span>
          <span class="lb-avatar" style="border-color:${leagueInfo.color}">${name.charAt(0).toUpperCase()}</span>
          <span class="lb-name">${name}${isMe ? ' (вы)' : ''}</span>
          <span class="lb-score">${formatNum(p.best_score)}</span>
        </div>
      `;
        }).join('');
    }

    // ============ FRIENDS ============
    async function loadFriends() {
        const listEl = document.getElementById('friends-list');
        const requestsEl = document.getElementById('friend-requests-list');
        const searchInput = document.getElementById('friend-search-input');
        const searchBtn = document.getElementById('friend-search-btn');
        const searchResults = document.getElementById('friend-search-results');

        listEl.innerHTML = '<div class="loading-text">Загрузка...</div>';
        requestsEl.innerHTML = '';

        // Load friends
        const friends = await API.getFriends(currentPlayerId);
        if (friends.length === 0) {
            listEl.innerHTML = '<div class="empty-text">У вас пока нет друзей.<br>Ищите игроков или приглашайте!</div>';
        } else {
            listEl.innerHTML = friends.map(f => {
                const name = f.username || f.first_name || 'Player';
                const li = API.getLeagueInfo(f.league);
                return `
          <div class="friend-card">
            <div class="friend-avatar" style="border-color:${li.color}">${name.charAt(0).toUpperCase()}</div>
            <div class="friend-info">
              <span class="friend-name">${name}</span>
              <span class="friend-league">${li.icon} ${li.name} • ${formatNum(f.best_score)} очков</span>
            </div>
            <button class="friend-chat-btn" data-id="${f.id}" data-name="${name}">💬</button>
          </div>
        `;
            }).join('');

            // Chat button handlers
            listEl.querySelectorAll('.friend-chat-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    openChatDialog(parseInt(btn.dataset.id), btn.dataset.name);
                });
            });
        }

        // Load pending requests
        const requests = await API.getPendingRequests(currentPlayerId);
        if (requests.length > 0) {
            // Load sender info for each request
            const requestCards = [];
            for (const req of requests) {
                const sender = await API.loadPlayer(req.from_id);
                const name = sender ? (sender.username || sender.first_name) : `ID:${req.from_id}`;
                requestCards.push(`
          <div class="request-card">
            <span class="request-name">📨 ${name}</span>
            <div class="request-actions">
              <button class="req-accept" data-id="${req.id}" data-from="${req.from_id}">✓</button>
              <button class="req-reject" data-id="${req.id}">✗</button>
            </div>
          </div>
        `);
            }
            requestsEl.innerHTML = `<div class="requests-header">Входящие запросы</div>` + requestCards.join('');

            requestsEl.querySelectorAll('.req-accept').forEach(btn => {
                btn.addEventListener('click', async () => {
                    await API.acceptFriendRequest(btn.dataset.id, parseInt(btn.dataset.from), currentPlayerId);
                    loadFriends();
                });
            });
            requestsEl.querySelectorAll('.req-reject').forEach(btn => {
                btn.addEventListener('click', async () => {
                    await API.rejectFriendRequest(btn.dataset.id);
                    loadFriends();
                });
            });
        }

        // Search
        searchBtn.onclick = async () => {
            const query = searchInput.value.trim();
            if (!query) return;
            searchResults.innerHTML = '<div class="loading-text">Поиск...</div>';
            const results = await API.searchPlayers(query, currentPlayerId);
            if (!results.length) {
                searchResults.innerHTML = '<div class="empty-text">Не найдено</div>';
                return;
            }
            searchResults.innerHTML = results.map(p => {
                const name = p.username || p.first_name || 'Player';
                const li = API.getLeagueInfo(p.league);
                return `
          <div class="search-result-card">
            <div class="friend-avatar small" style="border-color:${li.color}">${name.charAt(0).toUpperCase()}</div>
            <span class="search-name">${name}</span>
            <button class="add-friend-btn" data-id="${p.id}">+ Друг</button>
          </div>
        `;
            }).join('');

            searchResults.querySelectorAll('.add-friend-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    btn.disabled = true;
                    btn.textContent = '...';
                    await API.sendFriendRequest(currentPlayerId, parseInt(btn.dataset.id));
                    btn.textContent = '✓';
                });
            });
        };

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') searchBtn.click();
        });
    }

    // ============ CHAT LIST ============
    async function loadChatList() {
        const container = document.getElementById('chat-list');
        container.innerHTML = '<div class="loading-text">Загрузка...</div>';

        const chatList = await API.getChatList(currentPlayerId);
        if (!chatList.length) {
            container.innerHTML = '<div class="empty-text">Добавьте друзей, чтобы общаться!</div>';
            return;
        }

        container.innerHTML = chatList.map(c => {
            const name = c.username || c.first_name || 'Player';
            const lastMsg = c.lastMessage ? c.lastMessage.content.substring(0, 40) : 'Нет сообщений';
            const time = c.lastMessage ? formatTime(c.lastMessage.created_at) : '';
            const unread = c.unreadCount > 0 ? `<span class="chat-unread">${c.unreadCount}</span>` : '';
            return `
        <div class="chat-item" data-id="${c.id}" data-name="${name}">
          <div class="chat-avatar">${name.charAt(0).toUpperCase()}</div>
          <div class="chat-preview">
            <div class="chat-preview-header">
              <span class="chat-preview-name">${name}</span>
              <span class="chat-preview-time">${time}</span>
            </div>
            <div class="chat-preview-msg">${lastMsg}${unread}</div>
          </div>
        </div>
      `;
        }).join('');

        container.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                openChatDialog(parseInt(item.dataset.id), item.dataset.name);
            });
        });
    }

    // ============ CHAT DIALOG ============
    async function openChatDialog(friendId, friendName) {
        activeChatFriend = { id: friendId, name: friendName };
        hideAllSocial();
        setActiveNav('chat');

        const screen = document.getElementById('chat-dialog-screen');
        screen.classList.add('active');
        document.getElementById('chat-dialog-name').textContent = friendName;
        document.getElementById('bottom-nav').classList.add('visible');

        // Back button
        document.getElementById('chat-back-btn').onclick = () => {
            screen.classList.remove('active');
            showTab('chat');
        };

        await refreshMessages(friendId);

        // Send button
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send-btn');

        sendBtn.onclick = async () => {
            const text = input.value.trim();
            if (!text) return;
            input.value = '';
            await API.sendMessage(currentPlayerId, friendId, text);
            await refreshMessages(friendId);
        };

        input.onkeydown = (e) => {
            if (e.key === 'Enter') sendBtn.click();
        };

        // Poll for new messages
        if (chatPollInterval) clearInterval(chatPollInterval);
        chatPollInterval = setInterval(() => refreshMessages(friendId), 5000);
    }

    async function refreshMessages(friendId) {
        const container = document.getElementById('chat-messages');
        const messages = await API.getMessages(currentPlayerId, friendId);

        container.innerHTML = messages.map(m => {
            const isMine = m.from_id === currentPlayerId;
            const time = formatTime(m.created_at);
            return `
        <div class="msg ${isMine ? 'msg-mine' : 'msg-their'}">
          <div class="msg-bubble">${escapeHtml(m.content)}</div>
          <span class="msg-time">${time}</span>
        </div>
      `;
        }).join('');

        container.scrollTop = container.scrollHeight;
    }

    // ============ REFERRAL ============
    async function loadReferral() {
        const codeEl = document.getElementById('referral-code');
        const linkEl = document.getElementById('referral-link');
        const statsEl = document.getElementById('referral-stats');
        const copyBtn = document.getElementById('referral-copy-btn');
        const shareBtn = document.getElementById('referral-share-btn');

        const code = currentPlayerData.referral_code || 'REF' + currentPlayerId;
        const botUsername = 'FPVSpectrumBot'; // placeholder — update with real bot username
        const link = `https://t.me/${botUsername}?start=${code}`;

        codeEl.textContent = code;
        linkEl.textContent = link;

        const stats = await API.getReferralStats(currentPlayerId);
        statsEl.innerHTML = `
      <div class="ref-stat">
        <span class="ref-stat-value">${stats.count}</span>
        <span class="ref-stat-label">ПРИГЛАШЕНО</span>
      </div>
      <div class="ref-stat">
        <span class="ref-stat-value">+${formatNum(stats.bonusTotal)}</span>
        <span class="ref-stat-label">БОНУС ОЧКОВ</span>
      </div>
    `;

        copyBtn.onclick = () => {
            navigator.clipboard.writeText(link).then(() => {
                copyBtn.textContent = '✓ Скопировано';
                setTimeout(() => { copyBtn.textContent = '📋 Копировать'; }, 2000);
            });
        };

        shareBtn.onclick = () => {
            try {
                if (window.Telegram && Telegram.WebApp) {
                    Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Присоединяйся к FPV: Spectrum! 🎮🚁 +1000 бонусных очков!')}`);
                } else {
                    navigator.share({ title: 'FPV: Spectrum', text: 'Присоединяйся к игре! +1000 бонусных очков!', url: link });
                }
            } catch (e) {
                console.warn('Share not available:', e);
            }
        };
    }

    // ============ HELPERS ============
    function formatNum(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return String(n || 0);
    }

    function formatTime(isoStr) {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }

    function escapeHtml(text) {
        const el = document.createElement('span');
        el.textContent = text;
        return el.innerHTML;
    }

    async function updateUnreadBadge() {
        const count = await API.getUnreadCount(currentPlayerId);
        const badge = document.getElementById('chat-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    return {
        init, showTab, hideAllSocial, updateUnreadBadge, setActiveNav
    };
})();
