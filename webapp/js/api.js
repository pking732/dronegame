// ============================================
// API Layer — Supabase integration
// ============================================

const API = (() => {
  const SUPABASE_URL = 'https://wmckttambzjnhitgrsic.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtY2t0dGFtYnpqbmhpdGdyc2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0ODQwMzMsImV4cCI6MjA4ODA2MDAzM30.6NR0A93QLQdZ6fz8YUgm6Ax46oqWRmGqRvG7eHRNOv4';

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  // ---- League thresholds ----
  const LEAGUE_THRESHOLDS = {
    platinum: 20000,
    silver: 5000,
    bronze: 0
  };

  function calculateLeague(totalScore) {
    if (totalScore >= LEAGUE_THRESHOLDS.platinum) return 'platinum';
    if (totalScore >= LEAGUE_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  }

  function getLeagueInfo(league) {
    const info = {
      bronze: { name: 'БРОНЗА', icon: '🥉', color: '#cd7f32', min: 0, max: 4999 },
      silver: { name: 'СЕРЕБРО', icon: '🥈', color: '#c0c0c0', min: 5000, max: 19999 },
      platinum: { name: 'ПЛАТИНА', icon: '🏆', color: '#e5e4e2', min: 20000, max: Infinity }
    };
    return info[league] || info.bronze;
  }

  // ---- Player ----
  async function loadPlayer(telegramId) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/game_players?id=eq.${telegramId}&select=*`,
        { headers }
      );
      const data = await res.json();
      return data.length > 0 ? data[0] : null;
    } catch (e) {
      console.error('API loadPlayer error:', e);
      return null;
    }
  }

  async function createPlayer(telegramId, username, firstName, referredBy) {
    try {
      const refCode = 'REF' + telegramId + Math.random().toString(36).substring(2, 6).toUpperCase();
      const body = {
        id: telegramId,
        username: username || null,
        first_name: firstName || 'Player',
        total_score: 0,
        best_score: 0,
        games_played: 0,
        league: 'bronze',
        referral_code: refCode,
        referred_by: referredBy || null
      };
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/game_players`,
        {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(body)
        }
      );
      const data = await res.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (e) {
      console.error('API createPlayer error:', e);
      return null;
    }
  }

  async function saveScore(telegramId, sessionScore, totalScore, bestScore, gamesPlayed) {
    try {
      const league = calculateLeague(totalScore);
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/game_players?id=eq.${telegramId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            total_score: totalScore,
            best_score: bestScore,
            games_played: gamesPlayed,
            league: league,
            updated_at: new Date().toISOString()
          })
        }
      );
      return res.ok;
    } catch (e) {
      console.error('API saveScore error:', e);
      return false;
    }
  }

  async function getOrCreatePlayer(telegramId, username, firstName, referredBy) {
    let player = await loadPlayer(telegramId);
    if (!player) {
      player = await createPlayer(telegramId, username, firstName, referredBy);
      // If referred, award bonus
      if (player && referredBy) {
        await createReferral(referredBy, telegramId);
      }
    }
    return player || {
      id: telegramId,
      username: username,
      first_name: firstName || 'Player',
      total_score: 0,
      best_score: 0,
      games_played: 0,
      league: 'bronze',
      referral_code: 'REF' + telegramId
    };
  }

  // ---- Leaderboard ----
  async function getLeaderboard(league) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/game_players?league=eq.${league}&select=id,username,first_name,best_score,total_score,league&order=best_score.desc&limit=10`,
        { headers }
      );
      return await res.json();
    } catch (e) {
      console.error('API getLeaderboard error:', e);
      return [];
    }
  }

  // ---- Friends ----
  async function sendFriendRequest(fromId, toId) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/friend_requests`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ from_id: fromId, to_id: toId, status: 'pending' })
        }
      );
      const data = await res.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (e) {
      console.error('API sendFriendRequest error:', e);
      return null;
    }
  }

  async function getPendingRequests(userId) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/friend_requests?to_id=eq.${userId}&status=eq.pending&select=*`,
        { headers }
      );
      return await res.json();
    } catch (e) {
      console.error('API getPendingRequests error:', e);
      return [];
    }
  }

  async function acceptFriendRequest(requestId, fromId, toId) {
    try {
      // Update request status
      await fetch(
        `${SUPABASE_URL}/rest/v1/friend_requests?id=eq.${requestId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'accepted' })
        }
      );
      // Create bidirectional friendship
      await fetch(
        `${SUPABASE_URL}/rest/v1/friendships`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify([
            { user_id: fromId, friend_id: toId },
            { user_id: toId, friend_id: fromId }
          ])
        }
      );
      return true;
    } catch (e) {
      console.error('API acceptFriendRequest error:', e);
      return false;
    }
  }

  async function rejectFriendRequest(requestId) {
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/friend_requests?id=eq.${requestId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'rejected' })
        }
      );
      return true;
    } catch (e) {
      console.error('API rejectFriendRequest error:', e);
      return false;
    }
  }

  async function getFriends(userId) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/friendships?user_id=eq.${userId}&select=friend_id`,
        { headers }
      );
      const friendships = await res.json();
      if (!friendships.length) return [];

      const friendIds = friendships.map(f => f.friend_id);
      const idsFilter = friendIds.map(id => `id.eq.${id}`).join(',');
      const res2 = await fetch(
        `${SUPABASE_URL}/rest/v1/game_players?or=(${idsFilter})&select=id,username,first_name,best_score,total_score,league`,
        { headers }
      );
      return await res2.json();
    } catch (e) {
      console.error('API getFriends error:', e);
      return [];
    }
  }

  async function searchPlayers(query, excludeId) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/game_players?username=ilike.*${query}*&id=neq.${excludeId}&select=id,username,first_name,best_score,league&limit=10`,
        { headers }
      );
      return await res.json();
    } catch (e) {
      console.error('API searchPlayers error:', e);
      return [];
    }
  }

  // ---- Messages ----
  async function sendMessage(fromId, toId, content) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/messages`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ from_id: fromId, to_id: toId, content, read: false })
        }
      );
      const data = await res.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (e) {
      console.error('API sendMessage error:', e);
      return null;
    }
  }

  async function getMessages(userId, friendId) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/messages?or=(and(from_id.eq.${userId},to_id.eq.${friendId}),and(from_id.eq.${friendId},to_id.eq.${userId}))&order=created_at.asc&limit=50`,
        { headers }
      );
      // Mark as read
      fetch(
        `${SUPABASE_URL}/rest/v1/messages?from_id=eq.${friendId}&to_id=eq.${userId}&read=eq.false`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ read: true })
        }
      );
      return await res.json();
    } catch (e) {
      console.error('API getMessages error:', e);
      return [];
    }
  }

  async function getUnreadCount(userId) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/messages?to_id=eq.${userId}&read=eq.false&select=id`,
        { headers: { ...headers, 'Prefer': 'count=exact' } }
      );
      const range = res.headers.get('content-range');
      if (range) {
        const total = range.split('/')[1];
        return parseInt(total) || 0;
      }
      const data = await res.json();
      return Array.isArray(data) ? data.length : 0;
    } catch (e) {
      console.error('API getUnreadCount error:', e);
      return 0;
    }
  }

  async function getChatList(userId) {
    try {
      // Get friends with their latest message
      const friends = await getFriends(userId);
      const chatList = [];
      for (const friend of friends) {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/messages?or=(and(from_id.eq.${userId},to_id.eq.${friend.id}),and(from_id.eq.${friend.id},to_id.eq.${userId}))&order=created_at.desc&limit=1`,
          { headers }
        );
        const msgs = await res.json();
        const unreadRes = await fetch(
          `${SUPABASE_URL}/rest/v1/messages?from_id=eq.${friend.id}&to_id=eq.${userId}&read=eq.false&select=id`,
          { headers }
        );
        const unread = await unreadRes.json();
        chatList.push({
          ...friend,
          lastMessage: msgs[0] || null,
          unreadCount: Array.isArray(unread) ? unread.length : 0
        });
      }
      // Sort by latest message
      chatList.sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
        const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
        return bTime - aTime;
      });
      return chatList;
    } catch (e) {
      console.error('API getChatList error:', e);
      return [];
    }
  }

  // ---- Referrals ----
  async function createReferral(referrerId, referredId) {
    try {
      // Create referral record
      await fetch(
        `${SUPABASE_URL}/rest/v1/referrals`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ referrer_id: referrerId, referred_id: referredId, bonus_awarded: true })
        }
      );
      // Award 1000 bonus points to referrer
      const referrer = await loadPlayer(referrerId);
      if (referrer) {
        const newTotal = (referrer.total_score || 0) + 1000;
        await fetch(
          `${SUPABASE_URL}/rest/v1/game_players?id=eq.${referrerId}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              total_score: newTotal,
              league: calculateLeague(newTotal),
              updated_at: new Date().toISOString()
            })
          }
        );
      }
      return true;
    } catch (e) {
      console.error('API createReferral error:', e);
      return false;
    }
  }

  async function getReferralStats(userId) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/referrals?referrer_id=eq.${userId}&select=*`,
        { headers }
      );
      const data = await res.json();
      return {
        count: Array.isArray(data) ? data.length : 0,
        bonusTotal: (Array.isArray(data) ? data.length : 0) * 1000
      };
    } catch (e) {
      console.error('API getReferralStats error:', e);
      return { count: 0, bonusTotal: 0 };
    }
  }

  async function getPlayerByReferralCode(code) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/game_players?referral_code=eq.${code}&select=id`,
        { headers }
      );
      const data = await res.json();
      return data.length > 0 ? data[0] : null;
    } catch (e) {
      console.error('API getPlayerByReferralCode error:', e);
      return null;
    }
  }

  return {
    loadPlayer, createPlayer, saveScore, getOrCreatePlayer,
    calculateLeague, getLeagueInfo,
    getLeaderboard,
    sendFriendRequest, getPendingRequests, acceptFriendRequest, rejectFriendRequest, getFriends, searchPlayers,
    sendMessage, getMessages, getUnreadCount, getChatList,
    createReferral, getReferralStats, getPlayerByReferralCode
  };
})();
