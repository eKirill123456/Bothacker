// ============ ИГРОВЫЕ ПЕРЕМЕННЫЕ ============
let bitcoins = 100; // Стартовый капитал
let serversHacked = 0;
let hackPower = 1;

// Telegram данные
let playerId = null;
let playerName = 'GUEST';

// Статистика безопасности
let totalCaught = 0;
let totalLost = 0;

// Характеристики скрытности
let stealthLevel = 1;
let stealthPrice = 25;
let baseRisk = 50;

// Прогресс бар
let currentProgress = 0;
const maxProgress = 100;

// Прокачка кликера
let powerLevel = 1;
let powerPrice = 10;
let autoHackEnabled = false;
let autoHackPrice = 50;
let multiplierLevel = 1;
let multiplierPrice = 75;

let assistants = {
    miner: { count: 0, price: 30, limit: 10 },
    hacker: { count: 0, price: 60, limit: 8 },
    ai: { count: 0, price: 150, limit: 5 },
    cloak: { count: 0, price: 200, limit: 5 }
};

// Прогресс открытия арены
const ARENA_UNLOCK_COST = 1000;
let arenaUnlocked = false;

// Переменные арены
let arenaWins = 0;
let arenaLosses = 0;
let arenaTotalWon = 0;
let currentDifficulty = 'easy';
let currentBet = 500;
let currentTarget = null;
let isHacking = false;

// Инвентарь арены
let arenaInventory = {
    firewall: 0,
    exploit: 0,
    virus: 0,
    overload: 0
};

const shopPrices = {
    firewall: 100,
    exploit: 150,
    virus: 200,
    overload: 300
};

// Настройки сложности
const difficultySettings = {
    easy: {
        name: '🟢 ЛЕГКО',
        chance: 0.8,
        multiplier: 1.5,
        defenseRange: [1, 3]
    },
    medium: {
        name: '🟡 СРЕДНЕ',
        chance: 0.5,
        multiplier: 2.0,
        defenseRange: [3, 6]
    },
    hard: {
        name: '🔴 СЛОЖНО',
        chance: 0.3,
        multiplier: 3.0,
        defenseRange: [6, 10]
    },
    insane: {
        name: '💀 БЕЗУМИЕ',
        chance: 0.1,
        multiplier: 5.0,
        defenseRange: [10, 15]
    }
};

// ============ ИНИЦИАЛИЗАЦИЯ TELEGRAM ============
function initTelegramUser() {
    if (window.leaderboardAPI) {
        const user = window.leaderboardAPI.initTelegramData();
        playerName = window.leaderboardAPI.getTelegramUsername();
        playerId = window.leaderboardAPI.getCurrentPlayerId();
        
        // Обновляем отображение
        const userNameEl = document.getElementById('telegram-username');
        if (userNameEl) userNameEl.textContent = playerName;
        
        console.log('Telegram user initialized:', playerName);
        return true;
    }
    return false;
}

// ============ ФУНКЦИИ ЛИДЕРБОРДА ============
function updatePlayerStats() {
    if (!window.leaderboardAPI || !playerId) return;
    
    // Обновляем статистику в лидерборде
    window.leaderboardAPI.updatePlayerStats(
        playerId,
        playerName,
        calculateHackPower(), // Используем мощность как уровень
        serversHacked,
        arenaWins,
        Math.floor(bitcoins)
    );
    
    // Обновляем отображение в карточке игрока
    const nameDisplay = document.getElementById('player-name-display');
    if (nameDisplay) nameDisplay.textContent = playerName;
    
    const levelDisplay = document.getElementById('player-level-display');
    if (levelDisplay) levelDisplay.textContent = calculateHackPower();
    
    const serversDisplay = document.getElementById('player-servers-display');
    if (serversDisplay) serversDisplay.textContent = serversHacked;
    
    const winsDisplay = document.getElementById('player-wins-display');
    if (winsDisplay) winsDisplay.textContent = arenaWins;
    
    const btcDisplay = document.getElementById('player-btc-display');
    if (btcDisplay) btcDisplay.textContent = Math.floor(bitcoins);
    
    // Обновляем ранг
    const rank = window.leaderboardAPI.getPlayerRank(playerId);
    const rankDisplay = document.getElementById('player-rank-display');
    if (rankDisplay) rankDisplay.textContent = rank ? '#' + rank : '#???';
    
    const playerRank = document.getElementById('player-rank');
    if (playerRank) playerRank.textContent = rank ? '#' + rank : '#???';
}

function refreshLeaderboard() {
    if (!window.leaderboardAPI) return;
    
    const leaders = window.leaderboardAPI.getTopLeaders(50);
    const container = document.getElementById('leaderboard-rows');
    if (!container) return;
    
    if (leaders.length === 0) {
        container.innerHTML = '<div class="leaderboard-row"><div class="rank" colspan="6">Пока нет данных</div></div>';
        return;
    }
    
    let html = '';
    leaders.forEach((leader, index) => {
        const isCurrentPlayer = leader.id === playerId;
        const topClass = index === 0 ? 'top-1' : (index === 1 ? 'top-2' : (index === 2 ? 'top-3' : ''));
        const currentClass = isCurrentPlayer ? 'current-player' : '';
        
        html += `
            <div class="leaderboard-row ${topClass} ${currentClass}">
                <div class="rank">${index + 1}</div>
                <div class="name">${leader.name}</div>
                <div class="level">${leader.level}</div>
                <div class="servers">${leader.servers}</div>
                <div class="wins">${leader.wins}</div>
                <div class="btc">${leader.btc}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    updatePlayerStats();
}

function searchLeaderboard() {
    const searchInput = document.getElementById('search-player');
    if (!searchInput || !window.leaderboardAPI) return;
    
    const searchTerm = searchInput.value.toUpperCase();
    const leaders = window.leaderboardAPI.getTopLeaders(50);
    const container = document.getElementById('leaderboard-rows');
    
    if (!container) return;
    
    const filtered = leaders.filter(leader => 
        leader.name.toUpperCase().includes(searchTerm)
    );
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="leaderboard-row"><div class="rank" colspan="6">Ничего не найдено</div></div>';
        return;
    }
    
    let html = '';
    filtered.forEach((leader, index) => {
        const isCurrentPlayer = leader.id === playerId;
        const topClass = index === 0 ? 'top-1' : (index === 1 ? 'top-2' : (index === 2 ? 'top-3' : ''));
        const currentClass = isCurrentPlayer ? 'current-player' : '';
        
        html += `
            <div class="leaderboard-row ${topClass} ${currentClass}">
                <div class="rank">${leaders.findIndex(l => l.id === leader.id) + 1}</div>
                <div class="name">${leader.name}</div>
                <div class="level">${leader.level}</div>
                <div class="servers">${leader.servers}</div>
                <div class="wins">${leader.wins}</div>
                <div class="btc">${leader.btc}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============ ФУНКЦИИ БЕЗОПАСНОСТИ ============
function calculateRisk() {
    let risk = baseRisk;
    risk -= stealthLevel * 2;
    risk -= assistants.cloak.count * 3;
    risk += Math.floor(powerLevel / 3);
    risk = Math.max(5, Math.min(80, risk));
    return Math.floor(risk);
}

function getSecurityLevel() {
    const risk = calculateRisk();
    if (risk < 20) return { text: 'НИЗКИЙ', color: '#00ff00', class: 'low' };
    if (risk < 40) return { text: 'СРЕДНИЙ', color: '#ffff00', class: 'medium' };
    if (risk < 60) return { text: 'ВЫСОКИЙ', color: '#ff6600', class: 'high' };
    return { text: 'КРИТИЧНЫЙ', color: '#ff0000', class: 'high' };
}

function checkIfCaught() {
    const risk = calculateRisk();
    const roll = Math.random() * 100;
    return roll < risk;
}

function handleGettingCaught() {
    totalCaught++;
    
    const lossPercent = 10 + Math.floor(Math.random() * 20);
    const lossAmount = Math.floor(bitcoins * lossPercent / 100);
    
    bitcoins = Math.max(0, bitcoins - lossAmount);
    totalLost += lossAmount;
    
    showFailModal(lossAmount, lossPercent);
    
    document.getElementById('game-container').classList.add('alert-effect');
    setTimeout(() => {
        document.getElementById('game-container').classList.remove('alert-effect');
    }, 500);
    
    addMessage(`🚨 ВАС ЗАСЕКЛИ! Потеряно ${lossAmount} BTC (${lossPercent}%)`);
    
    return lossAmount;
}

function showFailModal(loss, percent) {
    const modal = document.getElementById('fail-modal');
    if (!modal) return;
    
    document.getElementById('fail-loss').textContent = `${loss} BTC`;
    document.getElementById('fail-shield').textContent = `${calculateRisk()}%`;
    
    const messages = [
        'Система безопасности обнаружила взлом!',
        'ФБР уже вычислило тебя!',
        'Твой IP заблокирован!',
        'Антивирус сработал!',
        'Полиция уже в пути!'
    ];
    
    document.getElementById('fail-message').textContent = messages[Math.floor(Math.random() * messages.length)];
    
    modal.classList.remove('hidden');
}

function closeFailModal() {
    const modal = document.getElementById('fail-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ============ ОБЩИЕ ФУНКЦИИ ============
function addMessage(msg) {
    const box = document.getElementById('message-box');
    if (box) {
        box.innerHTML = '> ' + msg;
    }
}

function updateUI() {
    // Основные ресурсы
    const bitcoinEl = document.getElementById('bitcoin-amount');
    if (bitcoinEl) bitcoinEl.textContent = Math.floor(bitcoins);
    
    const serversEl = document.getElementById('servers-hacked');
    if (serversEl) serversEl.textContent = serversHacked;
    
    const powerEl = document.getElementById('hack-power');
    if (powerEl) powerEl.textContent = calculateHackPower();
    
    // Характеристики безопасности
    const risk = calculateRisk();
    const security = getSecurityLevel();
    
    const stealthEl = document.getElementById('stealth-chance');
    if (stealthEl) stealthEl.textContent = (100 - risk) + '%';
    
    const riskEl = document.getElementById('risk-chance');
    if (riskEl) riskEl.textContent = risk + '%';
    
    // Обновляем индикатор безопасности
    const securityFill = document.getElementById('security-fill');
    const securityLevel = document.getElementById('security-level');
    const securityWarning = document.getElementById('security-warning');
    
    if (securityFill) securityFill.style.width = (100 - risk) + '%';
    if (securityLevel) {
        securityLevel.textContent = security.text;
        securityLevel.className = 'security-level ' + security.class;
    }
    
    if (securityWarning) {
        if (risk > 60) {
            securityWarning.innerHTML = '⚠️ КРИТИЧЕСКИЙ РИСК! Немедленно улучши скрытность!';
        } else if (risk > 40) {
            securityWarning.innerHTML = '⚠️ Высокий риск быть пойманным!';
        } else if (risk > 20) {
            securityWarning.innerHTML = '⚡ Средний риск, но будь осторожен';
        } else {
            securityWarning.innerHTML = '🛡️ Низкий риск, можно взламывать спокойно';
        }
    }
    
    // Помощники
    let totalAssistants = 0;
    for (let type in assistants) {
        totalAssistants += assistants[type].count;
        const countElement = document.getElementById(`${type}-count`);
        if (countElement) countElement.textContent = assistants[type].count;
        
        const priceElement = document.getElementById(`${type}-price`);
        if (priceElement) priceElement.textContent = assistants[type].price;
    }
    
    const assistantsEl = document.getElementById('assistants-count');
    if (assistantsEl) assistantsEl.textContent = totalAssistants;
    
    // Улучшения
    const powerLevelEl = document.getElementById('power-level');
    if (powerLevelEl) powerLevelEl.textContent = `Уровень: ${powerLevel}/20`;
    
    const powerPriceEl = document.getElementById('power-price');
    if (powerPriceEl) powerPriceEl.textContent = powerPrice;
    
    const stealthLevelEl = document.getElementById('stealth-level');
    if (stealthLevelEl) stealthLevelEl.textContent = `Уровень: ${stealthLevel}/20`;
    
    const stealthPriceEl = document.getElementById('stealth-price');
    if (stealthPriceEl) stealthPriceEl.textContent = stealthPrice;
    
    const autoPriceEl = document.getElementById('auto-price');
    if (autoPriceEl) autoPriceEl.textContent = autoHackPrice;
    
    const multiplierLevelEl = document.getElementById('multiplier-level');
    if (multiplierLevelEl) multiplierLevelEl.textContent = `Уровень: ${multiplierLevel}/15`;
    
    const multiplierPriceEl = document.getElementById('multiplier-price');
    if (multiplierPriceEl) multiplierPriceEl.textContent = multiplierPrice;
    
    // Прогресс открытия арены
    if (!arenaUnlocked) {
        const unlockProgress = Math.min(100, (bitcoins / ARENA_UNLOCK_COST) * 100);
        const unlockFill = document.getElementById('unlock-progress-fill');
        if (unlockFill) unlockFill.style.width = unlockProgress + '%';
        
        const unlockStatus = document.getElementById('unlock-status');
        if (unlockStatus) unlockStatus.textContent = `${Math.min(bitcoins, ARENA_UNLOCK_COST)}/${ARENA_UNLOCK_COST} BTC`;
        
        if (bitcoins >= ARENA_UNLOCK_COST && !arenaUnlocked) {
            unlockArena();
        }
    }
    
    // Статистика арены
    const arenaWinsEl = document.getElementById('arena-wins');
    if (arenaWinsEl) arenaWinsEl.textContent = arenaWins;
    
    const arenaLossesEl = document.getElementById('arena-losses');
    if (arenaLossesEl) arenaLossesEl.textContent = arenaLosses;
    
    const arenaWonEl = document.getElementById('arena-won');
    if (arenaWonEl) arenaWonEl.textContent = arenaTotalWon;
    
    // Инвентарь арены
    for (let item in arenaInventory) {
        const countElement = document.getElementById(`${item}-count`);
        if (countElement) countElement.textContent = arenaInventory[item];
    }
    
    // Обновляем прогресс бар
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        progressFill.style.width = currentProgress + '%';
    }
    
    // Обновляем статистику в лидерборде
    updatePlayerStats();
}

function calculateHackPower() {
    let power = powerLevel;
    power += assistants.hacker.count * 1;
    power += assistants.ai.count * 2;
    return power;
}

// ============ ОТКРЫТИЕ АРЕНЫ ============
function unlockArena() {
    arenaUnlocked = true;
    const modeSelector = document.getElementById('mode-selector');
    if (modeSelector) modeSelector.classList.remove('hidden');
    addMessage('🔓 PVP АРЕНА ОТКРЫТА! Теперь ты можешь сражаться с другими хакерами!');
    generateTarget();
}

function switchMode(mode) {
    const modeClicker = document.getElementById('mode-clicker');
    const modeArena = document.getElementById('mode-arena');
    const modeLeaderboard = document.getElementById('mode-leaderboard');
    const clickerMode = document.getElementById('clicker-mode');
    const arenaMode = document.getElementById('arena-mode');
    const leaderboardMode = document.getElementById('leaderboard-mode');
    
    if (modeClicker) modeClicker.classList.remove('active');
    if (modeArena) modeArena.classList.remove('active');
    if (modeLeaderboard) modeLeaderboard.classList.remove('active');
    
    if (mode === 'clicker') {
        if (clickerMode) clickerMode.classList.remove('hidden');
        if (arenaMode) arenaMode.classList.add('hidden');
        if (leaderboardMode) leaderboardMode.classList.add('hidden');
        if (modeClicker) modeClicker.classList.add('active');
        addMessage('💻 Режим взлома активирован');
    } else if (mode === 'arena') {
        if (clickerMode) clickerMode.classList.add('hidden');
        if (arenaMode) arenaMode.classList.remove('hidden');
        if (leaderboardMode) leaderboardMode.classList.add('hidden');
        if (modeArena) modeArena.classList.add('active');
        addMessage('⚔️ Добро пожаловать на PVP арену!');
    } else if (mode === 'leaderboard') {
        if (clickerMode) clickerMode.classList.add('hidden');
        if (arenaMode) arenaMode.classList.add('hidden');
        if (leaderboardMode) leaderboardMode.classList.remove('hidden');
        if (modeLeaderboard) modeLeaderboard.classList.add('active');
        addMessage('🏆 ТОП-50 лучших хакеров');
        refreshLeaderboard();
    }
}

// ============ ФУНКЦИИ КЛИКЕРА ============
function handleHack() {
    let earned = Math.floor(Math.random() * hackPower) + hackPower;
    
    const critChance = multiplierLevel * 2;
    if (Math.random() * 100 < critChance) {
        earned *= 2;
        addMessage('🎯 КРИТИЧЕСКИЙ ВЗЛОМ! x2 BTC!');
    }
    
    bitcoins += earned;
    serversHacked++;
    
    currentProgress += 2;
    
    if (currentProgress >= maxProgress) {
        currentProgress = 0;
        
        const caught = checkIfCaught();
        
        if (caught) {
            const loss = handleGettingCaught();
            
            const risk = calculateRisk();
            if (risk > 60) {
                addMessage('💀 ТЫ СОВСЕМ ОБНАГЛЕЛ? Система тебя вычислила!');
            } else if (risk > 40) {
                addMessage('👮‍♂️ Тебя почти поймали! Будь осторожнее!');
            } else {
                addMessage('😅 Фух, еле унес ноги...');
            }
        } else {
            const bonus = 10 + Math.floor(Math.random() * 20);
            bitcoins += bonus;
            addMessage(`🎉 БОНУС! +${bonus} BTC за успешную серию взломов!`);
        }
    } else {
        const successMessages = [
            'Доступ получен!',
            'Брандмауэр взломан!',
            'Данные извлечены!',
            'Следы заметены!'
        ];
        
        if (Math.random() > 0.7) {
            addMessage(successMessages[Math.floor(Math.random() * successMessages.length)]);
        }
    }
    
    const button = document.querySelector('.hack-button');
    if (button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 100);
    }
    
    updateUI();
}

function buyUpgrade(type) {
    if (type === 'power') {
        if (powerLevel >= 20) {
            addMessage('❌ Максимальный уровень!');
            return;
        }
        if (bitcoins >= powerPrice) {
            bitcoins -= powerPrice;
            powerLevel++;
            powerPrice = Math.floor(powerPrice * 1.5);
            addMessage('✅ Мощность взлома увеличена!');
        } else {
            addMessage('❌ Недостаточно биткоинов!');
        }
    } else if (type === 'stealth') {
        if (stealthLevel >= 20) {
            addMessage('❌ Максимальный уровень!');
            return;
        }
        if (bitcoins >= stealthPrice) {
            bitcoins -= stealthPrice;
            stealthLevel++;
            stealthPrice = Math.floor(stealthPrice * 1.6);
            const newRisk = calculateRisk();
            addMessage(`✅ Скрытность увеличена! Риск теперь ${newRisk}%`);
        } else {
            addMessage('❌ Недостаточно биткоинов!');
        }
    } else if (type === 'auto') {
        if (bitcoins >= autoHackPrice && !autoHackEnabled) {
            bitcoins -= autoHackPrice;
            autoHackEnabled = true;
            const autoBtn = document.querySelector('[onclick="buyUpgrade(\'auto\')"]');
            if (autoBtn) autoBtn.style.opacity = '0.5';
            addMessage('✅ Автоматический взлом активирован!');
            
            setInterval(() => {
                if (autoHackEnabled) {
                    const clickerMode = document.getElementById('clicker-mode');
                    if (clickerMode && !clickerMode.classList.contains('hidden')) {
                        handleHack();
                    }
                }
            }, 10000);
        } else if (autoHackEnabled) {
            addMessage('❌ Автоматический взлом уже активирован!');
        } else {
            addMessage('❌ Недостаточно биткоинов!');
        }
    } else if (type === 'multiplier') {
        if (multiplierLevel >= 15) {
            addMessage('❌ Максимальный уровень!');
            return;
        }
        if (bitcoins >= multiplierPrice) {
            bitcoins -= multiplierPrice;
            multiplierLevel++;
            multiplierPrice = Math.floor(multiplierPrice * 1.6);
            addMessage(`✅ Шанс крита увеличен до ${multiplierLevel * 2}%!`);
        } else {
            addMessage('❌ Недостаточно биткоинов!');
        }
    }
    
    updateUI();
}

function hireAssistant(type) {
    const assistant = assistants[type];
    
    if (assistant.count >= assistant.limit) {
        addMessage('❌ Лимит помощников!');
        return;
    }
    
    if (bitcoins >= assistant.price) {
        bitcoins -= assistant.price;
        assistant.count++;
        assistant.price = Math.floor(assistant.price * 1.7);
        
        let message = '';
        if (type === 'miner') message = '✅ Нанят крипто-майнер! +0.5 BTC/сек';
        else if (type === 'hacker') message = '✅ Нанят хакер! +1 к мощности';
        else if (type === 'ai') message = '✅ Нанят ИИ-помощник! +2 мощности и +1 BTC/сек';
        else if (type === 'cloak') {
            message = '✅ Нанят цифровой призрак! -3% к риску';
            const newRisk = calculateRisk();
            addMessage(`📊 Риск теперь ${newRisk}%`);
        }
        
        addMessage(message);
    } else {
        addMessage('❌ Недостаточно биткоинов!');
    }
    
    updateUI();
}

// ============ ФУНКЦИИ АРЕНЫ ============
function selectDifficulty(difficulty) {
    currentDifficulty = difficulty;
    
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        const btn = event.target.closest('.difficulty-btn');
        if (btn) btn.classList.add('active');
    }
    
    generateTarget();
}

function generateTarget() {
    const settings = difficultySettings[currentDifficulty];
    
    const names = [
        'ShadowHacker', 'CyberGhost', 'DarkWizard', 'NeoCoder', 
        'PhantomSec', 'VirusMaker', 'DataThief', 'NetRunner'
    ];
    
    const defense = Math.floor(Math.random() * (settings.defenseRange[1] - settings.defenseRange[0] + 1)) + settings.defenseRange[0];
    
    currentTarget = {
        name: names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000),
        defense: defense,
        settings: settings
    };
    
    const targetName = document.getElementById('target-name');
    if (targetName) targetName.textContent = `🎯 ${currentTarget.name}`;
    
    const targetDefense = document.getElementById('target-defense');
    if (targetDefense) targetDefense.textContent = currentTarget.defense;
    
    const potentialReward = Math.floor(currentBet * settings.multiplier);
    const targetReward = document.getElementById('target-reward');
    if (targetReward) targetReward.textContent = potentialReward;
}

function updateBetValue() {
    const slider = document.getElementById('bet-slider');
    if (slider) {
        currentBet = parseInt(slider.value);
        const betAmount = document.getElementById('bet-amount');
        if (betAmount) betAmount.textContent = currentBet;
        
        if (currentTarget) {
            const potentialReward = Math.floor(currentBet * difficultySettings[currentDifficulty].multiplier);
            const targetReward = document.getElementById('target-reward');
            if (targetReward) targetReward.textContent = potentialReward;
        }
    }
}

function setBet(amount) {
    const slider = document.getElementById('bet-slider');
    if (slider) {
        slider.value = amount;
        updateBetValue();
    }
}

function startArenaHack() {
    if (isHacking) return;
    
    if (bitcoins < currentBet) {
        addMessage('❌ Недостаточно биткоинов для ставки!');
        return;
    }
    
    if (!currentTarget) {
        generateTarget();
    }
    
    bitcoins -= currentBet;
    
    const hackProgress = document.getElementById('hack-progress');
    if (hackProgress) hackProgress.classList.remove('hidden');
    
    const arenaButton = document.getElementById('arena-button');
    if (arenaButton) arenaButton.disabled = true;
    
    isHacking = true;
    startHackProcess();
}

function startHackProcess() {
    const settings = difficultySettings[currentDifficulty];
    const log = document.getElementById('hack-log');
    const progressFill = document.getElementById('hack-progress-fill');
    const percentSpan = document.getElementById('hack-percent');
    
    if (!log || !progressFill || !percentSpan) return;
    
    let progress = 0;
    let phase = 0;
    
    const phases = [
        { text: 'Сканирование цели...', duration: 800 },
        { text: 'Обход файрвола...', duration: 1200 },
        { text: 'Взлом шифрования...', duration: 1500 },
        { text: 'Извлечение данных...', duration: 800 }
    ];
    
    log.innerHTML = '> Инициализация взлома...';
    
    let defense = currentTarget.defense;
    let powerMultiplier = 1;
    
    if (arenaInventory.virus > 0) {
        arenaInventory.virus--;
        defense = 0;
        log.innerHTML += '<br>🦠 Вирус отключил защиту цели!';
    }
    
    if (arenaInventory.exploit > 0) {
        arenaInventory.exploit--;
        powerMultiplier *= 1.3;
        log.innerHTML += '<br>💻 Эксплоит усилил атаку!';
    }
    
    if (arenaInventory.firewall > 0) {
        arenaInventory.firewall--;
        defense = Math.max(0, defense - 2);
        log.innerHTML += '<br>🛡️ Файрвол ослабил защиту!';
    }
    
    if (arenaInventory.overload > 0) {
        arenaInventory.overload--;
        powerMultiplier *= 2;
        log.innerHTML += '<br>⚡ Перегрузка активирована!';
    }
    
    let successChance = settings.chance;
    successChance += (powerLevel * 0.01);
    successChance -= (defense * 0.05);
    successChance = Math.max(0.1, Math.min(0.95, successChance));
    
    let attackPower = calculateHackPower() * powerMultiplier;
    
    log.innerHTML += `<br>> Шанс успеха: ${Math.round(successChance * 100)}%`;
    log.innerHTML += `<br>> Сила атаки: ${Math.round(attackPower)} vs Защита: ${defense}`;
    
    let currentPhase = 0;
    
    function nextPhase() {
        if (currentPhase < phases.length) {
            log.innerHTML += `<br>> ${phases[currentPhase].text}`;
            log.scrollTop = log.scrollHeight;
            
            const interval = setInterval(() => {
                progress += 25;
                progressFill.style.width = progress + '%';
                percentSpan.textContent = progress + '%';
                
                if (progress >= 100) {
                    clearInterval(interval);
                    currentPhase++;
                    setTimeout(nextPhase, 300);
                }
            }, phases[currentPhase].duration / 4);
            
            currentPhase++;
        } else {
            setTimeout(() => finishArenaHack(successChance, attackPower, defense), 500);
        }
    }
    
    nextPhase();
}

function finishArenaHack(successChance, attackPower, defensePower) {
    const settings = difficultySettings[currentDifficulty];
    const log = document.getElementById('hack-log');
    const container = document.getElementById('game-container');
    
    const roll = Math.random();
    const isSuccess = roll < successChance;
    
    if (isSuccess) {
        const reward = Math.floor(currentBet * settings.multiplier);
        
        bitcoins += reward;
        arenaWins++;
        arenaTotalWon += reward;
        
        if (log) {
            log.innerHTML += '<br>✅ ДОСТУП ПОЛУЧЕН! Данные извлечены!';
            log.innerHTML += `<br>💰 Выигрыш: +${reward} BTC`;
        }
        
        if (container) {
            container.classList.add('success-effect');
            setTimeout(() => container.classList.remove('success-effect'), 500);
        }
        
        addMessage(`✅ Победа на арене! +${reward} BTC`);
        
        if (Math.random() < 0.2) {
            const items = ['firewall', 'exploit', 'virus', 'overload'];
            const item = items[Math.floor(Math.random() * items.length)];
            arenaInventory[item]++;
            if (log) log.innerHTML += `<br>📦 Найден предмет: ${item}!`;
        }
    } else {
        arenaLosses++;
        
        if (log) {
            log.innerHTML += '<br>❌ ОШИБКА! Система засекла взлом!';
            log.innerHTML += `<br>💸 Потеряно: ${currentBet} BTC`;
        }
        
        if (container) {
            container.classList.add('fail-effect');
            setTimeout(() => container.classList.remove('fail-effect'), 500);
        }
        
        addMessage(`❌ Поражение на арене! Потеряно ${currentBet} BTC`);
    }
    
    updateUI();
    
    setTimeout(() => {
        const hackProgress = document.getElementById('hack-progress');
        if (hackProgress) hackProgress.classList.add('hidden');
        
        const arenaButton = document.getElementById('arena-button');
        if (arenaButton) arenaButton.disabled = false;
        
        isHacking = false;
        generateTarget();
    }, 2000);
}

function buyItem(item) {
    const price = shopPrices[item];
    
    if (bitcoins >= price) {
        if (arenaInventory[item] >= 5) {
            addMessage('❌ Можно иметь только 5 предметов этого типа!');
            return;
        }
        
        bitcoins -= price;
        arenaInventory[item]++;
        
        addMessage(`✅ Куплен ${item}`);
        updateUI();
    } else {
        addMessage('❌ Недостаточно биткоинов!');
    }
}

// ============ ПАССИВНЫЙ ДОХОД ============
setInterval(() => {
    if (!arenaUnlocked) {
        let passive = assistants.miner.count * 0.3 + assistants.ai.count * 0.5;
        if (passive > 0) {
            bitcoins += passive;
            updateUI();
        }
    } else {
        let passive = assistants.miner.count * 0.5 + assistants.ai.count * 1;
        if (passive > 0) {
            bitcoins += passive;
            updateUI();
        }
    }
}, 1000);

// ============ СОХРАНЕНИЕ ============
setInterval(() => {
    const gameState = {
        bitcoins,
        serversHacked,
        currentProgress,
        powerLevel,
        powerPrice,
        stealthLevel,
        stealthPrice,
        autoHackEnabled,
        autoHackPrice,
        multiplierLevel,
        multiplierPrice,
        assistants,
        arenaUnlocked,
        arenaWins,
        arenaLosses,
        arenaTotalWon,
        arenaInventory,
        totalCaught,
        totalLost
    };
    localStorage.setItem('hackerTerminalSave', JSON.stringify(gameState));
}, 30000);

function loadGame() {
    const saved = localStorage.getItem('hackerTerminalSave');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            Object.assign(this, state);
            
            if (arenaUnlocked) {
                const modeSelector = document.getElementById('mode-selector');
                if (modeSelector) modeSelector.classList.remove('hidden');
            }
            
            if (autoHackEnabled) {
                const autoBtn = document.querySelector('[onclick="buyUpgrade(\'auto\')"]');
                if (autoBtn) autoBtn.style.opacity = '0.5';
            }
            
            addMessage('💾 Прогресс загружен!');
            updateUI();
            
            if (arenaUnlocked) {
                generateTarget();
            }
        } catch (e) {
            console.error('Ошибка загрузки:', e);
        }
    }
    
    // Инициализируем Telegram
    initTelegramUser();
    
    // Загружаем лидеров
    if (window.leaderboardAPI) {
        window.leaderboardAPI.loadLeaders();
        refreshLeaderboard();
    }
}

// ============ ИНИЦИАЛИЗАЦИЯ ============
document.addEventListener('DOMContentLoaded', function() {
    loadGame();
    updateUI();
    generateTarget();
    
    const betSlider = document.getElementById('bet-slider');
    if (betSlider) {
        betSlider.value = currentBet;
        const betAmount = document.getElementById('bet-amount');
        if (betAmount) betAmount.textContent = currentBet;
    }
    
    console.log('Игра инициализирована');
});