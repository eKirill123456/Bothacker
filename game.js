// ============ ИГРОВЫЕ ПЕРЕМЕННЫЕ ============
let bitcoins = 100;
let serversHacked = 0;
let powerLevel = 1;
let stealthLevel = 1;
let autoLevel = 0;
let multiplierLevel = 1;
let assistantCounts = { miner: 0, hacker: 0, ai: 0, cloak: 0 };
let arenaWins = 0;
let arenaLosses = 0;
let arenaWon = 0;
let currentDifficulty = 'easy';
let currentBet = 500;
let arenaUnlocked = false;
let hackInProgress = false;

// Константы
const ARENA_UNLOCK_COST = 1000;
const MAX_UPGRADE_LEVEL = 20;
const MAX_ASSISTANTS = { miner: 10, hacker: 8, ai: 5, cloak: 5 };

// Telegram данные
let playerId = null;
let playerName = 'GUEST';
let tg = null;

// Цели для арены
const targetNames = [
    'ShadowCorp', 'DarkNet', 'CyberGhost', 'NeoSec', 'BlackHole',
    'PhantomSec', 'IronWall', 'StealthNet', 'CryptoShield', 'VoidSec'
];

let currentTarget = {
    name: '???',
    defense: 50,
    reward: 100
};

// ============ ИНИЦИАЛИЗАЦИЯ TELEGRAM ============
function initTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.expand();
        tg.enableClosingConfirmation();
        
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('user');
        
        if (userId) {
            playerId = userId;
            loadPlayerData(userId);
        }
        
        // Получаем имя пользователя из Telegram
        if (tg.initDataUnsafe?.user) {
            const user = tg.initDataUnsafe.user;
            playerName = user.username || `${user.first_name} ${user.last_name || ''}`.trim();
            document.getElementById('telegram-username').textContent = playerName;
        }
        
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
            
            bitcoins = data.bitcoins || 100;
            serversHacked = data.serversHacked || 0;
            powerLevel = data.powerLevel || 1;
            stealthLevel = data.stealthLevel || 1;
            arenaWins = data.arenaWins || 0;
            arenaLosses = data.arenaLosses || 0;
            playerName = data.name || playerName;
            
            document.getElementById('telegram-username').textContent = playerName;
            
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
                name: playerName,
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

// ============ ОСНОВНАЯ ЛОГИКА ИГРЫ ============

// Функция взлома
function handleHack() {
    if (hackInProgress) return;
    
    hackInProgress = true;
    document.querySelector('.hack-button').classList.add('glitch-effect');
    
    // Рассчитываем доход
    let earned = Math.floor(5 + (Math.random() * 10) + (powerLevel * 2));
    
    // Критический удар
    if (Math.random() * 100 < multiplierLevel * 2) {
        earned *= 2;
        addMessage('🔥 КРИТИЧЕСКИЙ ВЗЛОМ! x2 BTC');
    }
    
    // Шанс быть пойманным
    const baseCatchChance = 15;
    const stealthBonus = stealthLevel * 2;
    const catchChance = Math.max(5, baseCatchChance - stealthBonus);
    
    if (Math.random() * 100 < catchChance) {
        // Провал
        const loss = Math.floor(earned * 0.5);
        bitcoins = Math.max(0, bitcoins - loss);
        serversHacked = Math.max(0, serversHacked - 1);
        
        addMessage(`🚨 ВАС ЗАСЕКЛИ! Потеряно ${loss} BTC`);
        document.body.classList.add('fail-effect');
        
        // Показываем модальное окно
        showFailModal(loss);
        
        setTimeout(() => {
            document.body.classList.remove('fail-effect');
        }, 500);
    } else {
        // Успех
        bitcoins += earned;
        serversHacked++;
        
        addMessage(`✅ Взломан сервер #${serversHacked} | +${earned} BTC`);
        document.body.classList.add('success-effect');
        
        setTimeout(() => {
            document.body.classList.remove('success-effect');
        }, 500);
        
        // Проверка на открытие арены
        if (!arenaUnlocked && bitcoins >= ARENA_UNLOCK_COST) {
            arenaUnlocked = true;
            document.getElementById('mode-selector').classList.remove('hidden');
            addMessage('🔓 АРЕНА ОТКРЫТА! Теперь доступен PVP режим!');
            sendNotification('🎉 Ты достиг 1000 BTC! Арена открыта!');
        }
        
        // Юбилейные взломы
        if (serversHacked % 100 === 0) {
            sendNotification(`🏆 Ты взломал ${serversHacked} серверов! Так держать!`);
        }
    }
    
    updateUI();
    savePlayerData();
    
    setTimeout(() => {
        document.querySelector('.h-button').classList.remove('glitch-effect');
        hackInProgress = false;
    }, 300);
}

// Покупка улучшений
function buyUpgrade(type) {
    let cost = getUpgradeCost(type);
    let currentLevel = getUpgradeLevel(type);
    let maxLevel = MAX_UPGRADE_LEVEL;
    
    if (currentLevel >= maxLevel) {
        addMessage(`⚠️ Максимальный уровень достигнут!`);
        return;
    }
    
    if (bitcoins >= cost) {
        bitcoins -= cost;
        
        switch(type) {
            case 'power':
                powerLevel++;
                addMessage(`⚡ Мощность взлома: ${powerLevel}`);
                break;
            case 'stealth':
                stealthLevel++;
                addMessage(`🕵️ Скрытность: ${stealthLevel}`);
                break;
            case 'auto':
                autoLevel++;
                addMessage(`⚙️ Автовзломщик: ${autoLevel}`);
                break;
            case 'multiplier':
                multiplierLevel++;
                addMessage(`🎯 Крит. шанс: ${multiplierLevel * 2}%`);
                break;
        }
        
        updateUI();
        savePlayerData();
    } else {
        addMessage(`❌ Недостаточно BTC! Нужно ${cost}`);
    }
}

// Найм помощников
function hireAssistant(type) {
    let cost = getAssistantCost(type);
    let currentCount = assistantCounts[type] || 0;
    let maxCount = MAX_ASSISTANTS[type];
    
    if (currentCount >= maxCount) {
        addMessage(`⚠️ Максимум помощников этого типа!`);
        return;
    }
    
    if (bitcoins >= cost) {
        bitcoins -= cost;
        assistantCounts[type]++;
        
        switch(type) {
            case 'miner':
                addMessage(`⛏️ Майнер нанят! +0.5 BTC/сек`);
                break;
            case 'hacker':
                powerLevel++;
                addMessage(`👨‍💻 Хакер нанят! Мощность +1`);
                break;
            case 'ai':
                powerLevel += 2;
                addMessage(`🧠 ИИ нанят! Мощность +2, +1 BTC/сек`);
                break;
            case 'cloak':
                stealthLevel++;
                addMessage(`👻 Призрак нанят! Скрытность +1, риск -3%`);
                break;
        }
        
        updateUI();
        savePlayerData();
    } else {
        addMessage(`❌ Недостаточно BTC! Нужно ${cost}`);
    }
}

// Получение стоимости улучшения
function getUpgradeCost(type) {
    let level = getUpgradeLevel(type);
    let baseCost = {
        'power': 10,
        'stealth': 25,
        'auto': 50,
        'multiplier': 75
    }[type] || 10;
    
    return Math.floor(baseCost * Math.pow(1.5, level - 1));
}

// Получение уровня улучшения
function getUpgradeLevel(type) {
    switch(type) {
        case 'power': return powerLevel;
        case 'stealth': return stealthLevel;
        case 'auto': return autoLevel;
        case 'multiplier': return multiplierLevel;
        default: return 1;
    }
}

// Получение стоимости помощника
function getAssistantCost(type) {
    let count = assistantCounts[type] || 0;
    let baseCost = {
        'miner': 30,
        'hacker': 60,
        'ai': 150,
        'cloak': 200
    }[type] || 30;
    
    return Math.floor(baseCost * Math.pow(1.3, count));
}

// ============ ЛОГИКА АРЕНЫ ============

// Выбор сложности
function selectDifficulty(difficulty) {
    currentDifficulty = difficulty;
    
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.difficulty-btn.${difficulty}`).classList.add('active');
    
    generateTarget();
}

// Обновление ставки
function updateBetValue() {
    const slider = document.getElementById('bet-slider');
    currentBet = parseInt(slider.value);
    document.getElementById('bet-amount').textContent = currentBet;
    generateTarget();
}

// Установка ставки
function setBet(amount) {
    const slider = document.getElementById('bet-slider');
    slider.value = amount;
    currentBet = amount;
    document.getElementById('bet-amount').textContent = amount;
    generateTarget();
}

// Генерация цели
function generateTarget() {
    const difficulty = currentDifficulty;
    const bet = currentBet;
    
    let defense, multiplier;
    
    switch(difficulty) {
        case 'easy':
            defense = Math.floor(30 + Math.random() * 20);
            multiplier = 1.5;
            break;
        case 'medium':
            defense = Math.floor(50 + Math.random() * 25);
            multiplier = 2.0;
            break;
        case 'hard':
            defense = Math.floor(70 + Math.random() * 20);
            multiplier = 3.0;
            break;
        case 'insane':
            defense = Math.floor(85 + Math.random() * 15);
            multiplier = 5.0;
            break;
        default:
            defense = 50;
            multiplier = 1.5;
    }
    
    const reward = Math.floor(bet * multiplier);
    const name = targetNames[Math.floor(Math.random() * targetNames.length)];
    
    currentTarget = {
        name,
        defense,
        reward,
        difficulty
    };
    
    document.getElementById('target-name').textContent = `🎯 ${name}`;
    document.getElementById('target-defense').textContent = defense;
    document.getElementById('target-reward').textContent = reward;
    
    let rating = 'C';
    if (defense >= 85) rating = 'S';
    else if (defense >= 70) rating = 'A';
    else if (defense >= 50) rating = 'B';
    else if (defense >= 30) rating = 'C';
    else rating = 'D';
    
    document.getElementById('target-rating').textContent = rating;
}

// Начало взлома на арене
function startArenaHack() {
    if (hackInProgress) return;
    if (bitcoins < currentBet) {
        addMessage('❌ Недостаточно BTC для ставки!');
        return;
    }
    
    hackInProgress = true;
    document.getElementById('arena-button').disabled = true;
    document.getElementById('hack-progress').classList.remove('hidden');
    
    // Списываем ставку
    bitcoins -= currentBet;
    updateUI();
    
    // Анимация взлома
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) progress = 100;
        
        document.getElementById('hack-progress-fill').style.width = progress + '%';
        document.getElementById('hack-percent').textContent = Math.floor(progress) + '%';
        
        // Логи взлома
        if (progress < 30) {
            addHackLog('> Сканирование цели...');
        } else if (progress < 60) {
            addHackLog('> Обход файрвола...');
        } else if (progress < 90) {
            addHackLog('> Взлом защиты...');
        } else if (progress < 100) {
            addHackLog('> Почти готово...');
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            finishArenaHack();
        }
    }, 300);
}

// Завершение взлома на арене
function finishArenaHack() {
    // Рассчитываем шанс успеха
    let successChance;
    switch(currentTarget.difficulty) {
        case 'easy': successChance = 80; break;
        case 'medium': successChance = 50; break;
        case 'hard': successChance = 30; break;
        case 'insane': successChance = 10; break;
        default: successChance = 50;
    }
    
    // Модификатор от скрытности
    successChance += stealthLevel * 2;
    successChance = Math.min(95, successChance);
    
    const isSuccess = Math.random() * 100 < successChance;
    
    if (isSuccess) {
        // Успех
        const reward = currentTarget.reward;
        bitcoins += reward;
        arenaWins++;
        arenaWon += reward;
        
        addMessage(`🎉 ПОБЕДА! +${reward} BTC`);
        addHackLog('✅ Доступ получен! Данные скопированы!');
        
        if (reward > 500) {
            sendNotification(`💰 ОГО! +${reward} BTC на арене! Ты в ударе!`);
        }
        
        // Достижения
        if (arenaWins === 10 || arenaWins === 25 || arenaWins === 50 || arenaWins === 100) {
            sendNotification(`🏆 Достижение: ${arenaWins} побед на арене!`);
        }
    } else {
        // Провал
        arenaLosses++;
        
        addMessage(`💔 ПРОВАЛ! Цель оказалась слишком сильной`);
        addHackLog('❌ Ошибка! Система засекла взлом!');
        
        // Дополнительный штраф
        const penalty = Math.floor(currentBet * 0.2);
        if (bitcoins >= penalty) {
            bitcoins -= penalty;
            addMessage(`💰 Штраф: -${penalty} BTC`);
        }
    }
    
    // Обновляем UI
    document.getElementById('arena-wins').textContent = arenaWins;
    document.getElementById('arena-losses').textContent = arenaLosses;
    document.getElementById('arena-won').textContent = arenaWon;
    
    // Сбрасываем состояние
    setTimeout(() => {
        document.getElementById('hack-progress').classList.add('hidden');
        document.getElementById('arena-button').disabled = false;
        hackInProgress = false;
        generateTarget();
    }, 2000);
    
    updateUI();
    savePlayerData();
}

// Добавление лога взлома
function addHackLog(message) {
    const log = document.getElementById('hack-log');
    log.innerHTML = message + '<br>' + log.innerHTML;
    if (log.children.length > 5) {
        log.removeChild(log.lastChild);
    }
}

// Добавление сообщения
function addMessage(msg) {
    const box = document.getElementById('message-box');
    box.innerHTML = msg;
    setTimeout(() => {
        if (box.innerHTML === msg) {
            box.innerHTML = '> Система ожидает команды...';
        }
    }, 3000);
}

// Показ модального окна провала
function showFailModal(loss) {
    document.getElementById('fail-loss').textContent = loss + ' BTC';
    document.getElementById('fail-shield').textContent = stealthLevel * 5 + '%';
    document.getElementById('fail-modal').classList.remove('hidden');
}

// Закрытие модального окна
function closeFailModal() {
    document.getElementById('fail-modal').classList.add('hidden');
}

// Обновление UI
function updateUI() {
    document.getElementById('bitcoin-amount').textContent = Math.floor(bitcoins);
    document.getElementById('servers-hacked').textContent = serversHacked;
    
    // Общая мощность
    let totalPower = powerLevel;
    if (assistantCounts.hacker) totalPower += assistantCounts.hacker;
    if (assistantCounts.ai) totalPower += assistantCounts.ai * 2;
    
    document.getElementById('hack-power').textContent = totalPower;
    
    // Улучшения
    document.getElementById('power-level').textContent = `Уровень: ${powerLevel}/${MAX_UPGRADE_LEVEL}`;
    document.getElementById('stealth-level').textContent = `Уровень: ${stealthLevel}/${MAX_UPGRADE_LEVEL}`;
    document.getElementById('multiplier-level').textContent = `Уровень: ${multiplierLevel}/15`;
    
    document.getElementById('power-price').textContent = getUpgradeCost('power');
    document.getElementById('stealth-price').textContent = getUpgradeCost('stealth');
    document.getElementById('auto-price').textContent = getUpgradeCost('auto');
    document.getElementById('multiplier-price').textContent = getUpgradeCost('multiplier');
    
    // Помощники
    document.getElementById('miner-count').textContent = assistantCounts.miner || 0;
    document.getElementById('hacker-count').textContent = assistantCounts.hacker || 0;
    document.getElementById('ai-count').textContent = assistantCounts.ai || 0;
    document.getElementById('cloak-count').textContent = assistantCounts.cloak || 0;
    
    document.getElementById('miner-price').textContent = getAssistantCost('miner');
    document.getElementById('hacker-price').textContent = getAssistantCost('hacker');
    document.getElementById('ai-price').textContent = getAssistantCost('ai');
    document.getElementById('cloak-price').textContent = getAssistantCost('cloak');
    
    // Индикатор безопасности
    const securityLevel = document.getElementById('security-level');
    const securityFill = document.getElementById('security-fill');
    const risk = Math.max(5, 50 - stealthLevel * 3);
    
    securityFill.style.width = risk + '%';
    
    if (risk < 20) {
        securityLevel.textContent = 'НИЗКИЙ';
        securityLevel.className = 'security-level low';
        document.getElementById('security-warning').innerHTML = '✅ Риск минимален';
    } else if (risk < 40) {
        securityLevel.textContent = 'СРЕДНИЙ';
        securityLevel.className = 'security-level medium';
        document.getElementById('security-warning').innerHTML = '⚠️ Будь осторожен';
    } else {
        securityLevel.textContent = 'ВЫСОКИЙ';
        securityLevel.className = 'security-level high';
        document.getElementById('security-warning').innerHTML = '🔴 ВАС МОГУТ ЗАСЕЧЬ!';
    }
    
    // Прогресс до арены
    const progress = Math.min(100, (bitcoins / ARENA_UNLOCK_COST) * 100);
    document.getElementById('unlock-progress-fill').style.width = progress + '%';
    document.getElementById('unlock-status').textContent = `${Math.floor(bitcoins)}/${ARENA_UNLOCK_COST} BTC`;
    
    // Прогресс взлома
    const hackProgress = (serversHacked % 10) * 10;
    document.getElementById('progress-fill').style.width = hackProgress + '%';
}

// Переключение режимов
function switchMode(mode) {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`mode-${mode}`).classList.add('active');
    
    document.getElementById('clicker-mode').classList.add('hidden');
    document.getElementById('arena-mode').classList.add('hidden');
    document.getElementById('leaderboard-mode').classList.add('hidden');
    
    document.getElementById(`${mode}-mode`).classList.remove('hidden');
    
    if (mode === 'arena' && arenaUnlocked) {
        generateTarget();
    }
    
    if (mode === 'leaderboard') {
        refreshLeaderboard();
    }
}

// Загрузка игры из localStorage
function loadGame() {
    const saved = localStorage.getItem('hackersTerminal');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            bitcoins = data.bitcoins || 100;
            serversHacked = data.serversHacked || 0;
            powerLevel = data.powerLevel || 1;
            stealthLevel = data.stealthLevel || 1;
            autoLevel = data.autoLevel || 0;
            multiplierLevel = data.multiplierLevel || 1;
            assistantCounts = data.assistantCounts || { miner: 0, hacker: 0, ai: 0, cloak: 0 };
            arenaWins = data.arenaWins || 0;
            arenaLosses = data.arenaLosses || 0;
            arenaWon = data.arenaWon || 0;
            
            if (bitcoins >= ARENA_UNLOCK_COST) {
                arenaUnlocked = true;
            }
            
            addMessage('✅ Локальное сохранение загружено');
        } catch (e) {
            console.error('Ошибка загрузки:', e);
        }
    }
}

// Сохранение в localStorage
function saveGame() {
    const data = {
        bitcoins,
        serversHacked,
        powerLevel,
        stealthLevel,
        autoLevel,
        multiplierLevel,
        assistantCounts,
        arenaWins,
        arenaLosses,
        arenaWon,
        lastSave: new Date().toISOString()
    };
    
    localStorage.setItem('hackersTerminal', JSON.stringify(data));
}

// ============ ЛИДЕРБОРД ============

// Получение лидерборда с сервера
async function refreshLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
        if (response.ok) {
            const leaders = await response.json();
            displayLeaderboard(leaders);
            
            if (playerId) {
                const rankResponse = await fetch(`/api/rank/${playerId}`);
                if (rankResponse.ok) {
                    const { rank } = await rankResponse.json();
                    if (rank) {
                        document.getElementById('player-rank').textContent = `#${rank}`;
                        document.getElementById('player-rank-display').textContent = `#${rank}`;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки лидерборда:', error);
        
        // Заглушка для теста
        const mockLeaders = [
            { id: '1', name: 'ShadowMaster', powerLevel: 42, serversHacked: 1337, arenaWins: 89, bitcoins: 50000 },
            { id: '2', name: 'NeoCoder', powerLevel: 38, serversHacked: 954, arenaWins: 76, bitcoins: 35000 },
            { id: '3', name: 'DarkWizard', powerLevel: 35, serversHacked: 821, arenaWins: 62, bitcoins: 28000 }
        ];
        displayLeaderboard(mockLeaders);
    }
    
    // Обновляем статистику игрока
    document.getElementById('player-name-display').textContent = playerName;
    document.getElementById('player-btc-display').textContent = Math.floor(bitcoins);
    document.getElementById('player-level-display').textContent = powerLevel;
    document.getElementById('player-servers-display').textContent = serversHacked;
    document.getElementById('player-wins-display').textContent = arenaWins;
}

// Отображение лидерборда
function displayLeaderboard(leaders) {
    const container = document.getElementById('leaderboard-rows');
    if (!container) return;
    
    if (!leaders || leaders.length === 0) {
        container.innerHTML = '<div class="leaderboard-row"><div class="rank" colspan="6">Пока нет данных</div></div>';
        return;
    }
    
    let html = '';
    leaders.slice(0, 50).forEach((leader, index) => {
        const isCurrentPlayer = leader.id == playerId;
        const topClass = index === 0 ? 'top-1' : (index === 1 ? 'top-2' : (index === 2 ? 'top-3' : ''));
        const currentClass = isCurrentPlayer ? 'current-player' : '';
        
        html += `
            <div class="leaderboard-row ${topClass} ${currentClass}">
                <div class="rank">${index + 1}</div>
                <div class="name">${leader.name || 'HACKER'}</div>
                <div class="level">${leader.powerLevel || 1}</div>
                <div class="servers">${leader.serversHacked || 0}</div>
                <div class="wins">${leader.arenaWins || 0}</div>
                <div class="btc">${leader.bitcoins || 0}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Поиск по лидерборду
function searchLeaderboard() {
    const searchTerm = document.getElementById('search-player').value.toLowerCase();
    const rows = document.querySelectorAll('#leaderboard-rows .leaderboard-row');
    
    rows.forEach(row => {
        const name = row.querySelector('.name')?.textContent.toLowerCase() || '';
        if (name.includes(searchTerm) || searchTerm === '') {
            row.style.display = 'grid';
        } else {
            row.style.display = 'none';
        }
    });
}

// ============ ИНИЦИАЛИЗАЦИЯ ============
document.addEventListener('DOMContentLoaded', async function() {
    // Инициализируем Telegram
    initTelegram();
    
    // Загружаем локальное сохранение
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
        betSlider.addEventListener('input', updateBetValue);
    }
    
    // Загружаем лидерборд
    refreshLeaderboard();
    
    // Обновляем лидерборд каждые 30 секунд
    setInterval(refreshLeaderboard, 30000);
    
    // Сохраняем на сервер каждую минуту
    setInterval(() => {
        savePlayerData();
        saveGame();
    }, 60000);
    
    // Авто-взломщик
    setInterval(() => {
        if (autoLevel > 0 && !hackInProgress) {
            handleHack();
        }
    }, 10000);
    
    // Пассивный доход от помощников
    setInterval(() => {
        let passiveIncome = 0;
        passiveIncome += (assistantCounts.miner || 0) * 0.5;
        passiveIncome += (assistantCounts.ai || 0) * 1;
        
        if (passiveIncome > 0) {
            bitcoins += passiveIncome;
            updateUI();
            saveGame();
        }
    }, 1000);
    
    console.log('Игра инициализирована');
});

// Сохраняем при закрытии
window.addEventListener('beforeunload', () => {
    saveGame();
    savePlayerData();
});
