// ============ ИГРОВЫЕ ПЕРЕМЕННЫЕ ============
let bitcoins = 100;
let serversHacked = 0;
let hackPower = 1;

// Telegram данные
let playerId = null;
let playerName = 'GUEST';
let tg = null;

// Остальные переменные оставляем как в вашем коде...

// ============ ИНИЦИАЛИЗАЦИЯ TELEGRAM ============
function initTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.expand(); // Разворачиваем на весь экран
        tg.enableClosingConfirmation(); // Подтверждение закрытия
        
        // Получаем параметры из URL
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('user');
        
        if (userId) {
            playerId = userId;
            loadPlayerData(userId);
        }
        
        // Устанавливаем основную кнопку
        tg.MainButton.setText('ЗАКРЫТЬ').onClick(() => tg.close());
        
        console.log('Telegram WebApp инициализирован');
        return true;
    }
    return false;
}

// Загрузка данных игрока с сервера
async function loadPlayerData(userId) {
    try {
        const response = await fetch(`/api/player/${userId}`);
        if (response.ok) {
            const data = await response.json();
            
            // Загружаем данные
            bitcoins = data.bitcoins || 100;
            serversHacked = data.serversHacked || 0;
            powerLevel = data.powerLevel || 1;
            stealthLevel = data.stealthLevel || 1;
            arenaWins = data.arenaWins || 0;
            arenaLosses = data.arenaLosses || 0;
            
            playerName = data.name || 'HACKER';
            
            // Обновляем UI
            document.getElementById('telegram-username').textContent = playerName;
            
            // Проверяем открытие арены
            if (bitcoins >= ARENA_UNLOCK_COST) {
                arenaUnlocked = true;
                document.getElementById('mode-selector').classList.remove('hidden');
            }
            
            updateUI();
            addMessage('✅ Данные загружены с сервера');
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        addMessage('⚠️ Ошибка загрузки, играем локально');
    }
}

// Сохранение данных на сервер
async function savePlayerData() {
    if (!playerId) return;
    
    try {
        await fetch(`/api/player/${playerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bitcoins: Math.floor(bitcoins),
                serversHacked,
                powerLevel,
                stealthLevel,
                arenaWins,
                arenaLosses,
                lastUpdate: new Date().toISOString()
            })
        });
    } catch (error) {
        console.error('Ошибка сохранения:', error);
    }
}

// Отправка уведомления
async function sendNotification(message) {
    if (!playerId) return;
    
    try {
        await fetch(`/api/notify/${playerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
    } catch (error) {
        console.error('Ошибка отправки уведомления:', error);
    }
}

// Обновленная функция handleHack с уведомлениями
function handleHack() {
    // ... ваш существующий код ...
    
    // Отправляем уведомление при важных событиях
    if (bitcoins > 1000 && bitcoins - earned < 1000) {
        sendNotification('🎉 Ты достиг 1000 BTC! Арена открыта!');
    }
    
    if (serversHacked % 100 === 0 && serversHacked > 0) {
        sendNotification(`🏆 Ты взломал ${serversHacked} серверов! Так держать!`);
    }
    
    // Сохраняем данные
    savePlayerData();
    updateUI();
}

// Обновленная функция для арены
function finishArenaHack(successChance) {
    // ... ваш существующий код ...
    
    if (isSuccess) {
        // Уведомление о крупном выигрыше
        if (reward > 500) {
            sendNotification(`💰 ОГО! +${reward} BTC на арене! Ты в ударе!`);
        }
        
        // Проверка на рекорд
        if (arenaWins === 10 || arenaWins === 25 || arenaWins === 50 || arenaWins === 100) {
            sendNotification(`🏆 Достижение: ${arenaWins} побед на арене!`);
        }
    }
    
    // Сохраняем после арены
    savePlayerData();
}

// Уведомление о поимке
function handleGettingCaught() {
    const lossAmount = super.handleGettingCaught(); // вызываем оригинальную функцию
    
    if (lossAmount > 200) {
        sendNotification(`🚨 ТЕБЯ ПОЙМАЛИ! Потеряно ${lossAmount} BTC! Будь осторожнее!`);
    }
    
    return lossAmount;
}

// Получение лидерборда с сервера
async function refreshLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
        if (response.ok) {
            const leaders = await response.json();
            displayLeaderboard(leaders);
            
            // Получаем ранг игрока
            const rankResponse = await fetch(`/api/rank/${playerId}`);
            if (rankResponse.ok) {
                const { rank } = await rankResponse.json();
                if (rank) {
                    document.getElementById('player-rank').textContent = `#${rank}`;
                }
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки лидерборда:', error);
    }
}

// Отображение лидерборда
function displayLeaderboard(leaders) {
    const container = document.getElementById('leaderboard-rows');
    if (!container) return;
    
    if (leaders.length === 0) {
        container.innerHTML = '<div class="leaderboard-row"><div class="rank" colspan="6">Пока нет данных</div></div>';
        return;
    }
    
    let html = '';
    leaders.forEach((leader, index) => {
        const isCurrentPlayer = leader.id == playerId;
        const topClass = index === 0 ? 'top-1' : (index === 1 ? 'top-2' : (index === 2 ? 'top-3' : ''));
        const currentClass = isCurrentPlayer ? 'current-player' : '';
        
        html += `
            <div class="leaderboard-row ${topClass} ${currentClass}">
                <div class="rank">${index + 1}</div>
                <div class="name">${leader.name}</div>
                <div class="level">${leader.powerLevel || 1}</div>
                <div class="servers">${leader.serversHacked || 0}</div>
                <div class="wins">${leader.arenaWins || 0}</div>
                <div class="btc">${leader.bitcoins || 0}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============ ИНИЦИАЛИЗАЦИЯ ============
document.addEventListener('DOMContentLoaded', async function() {
    // Инициализируем Telegram
    initTelegram();
    
    // Загружаем локальное сохранение (как запасной вариант)
    loadGame();
    
    // Обновляем UI
    updateUI();
    
    // Генерируем цель для арены
    generateTarget();
    
    // Устанавливаем ползунок ставки
    const betSlider = document.getElementById('bet-slider');
    if (betSlider) {
        betSlider.value = currentBet;
        document.getElementById('bet-amount').textContent = currentBet;
    }
    
    // Загружаем лидерборд
    refreshLeaderboard();
    
    // Обновляем лидерборд каждые 30 секунд
    setInterval(refreshLeaderboard, 30000);
    
    // Сохраняем на сервер каждую минуту
    setInterval(savePlayerData, 60000);
    
    console.log('Игра инициализирована в Telegram WebApp');
});

// Переопределяем функцию сохранения
const originalSaveInterval = setInterval;
setInterval = function(callback, delay) {
    if (delay === 30000) { // Перехватываем локальное сохранение
        return originalSaveInterval(savePlayerData, 60000);
    }
    return originalSaveInterval(callback, delay);
};
