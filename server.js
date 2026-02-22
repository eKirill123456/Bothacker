const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Токен бота (получите у @BotFather)
const TOKEN = '8061075309:AAHaf0fgYV-3LY81YQXpQwtmhTg0EjIgQNw';
const bot = new TelegramBot(TOKEN, { polling: true });

const app = express();
const PORT = process.env.PORT || 3000;

// Хранилище данных игроков
const players = new Map();
const leaderboard = [];

// Загрузка данных при старте
try {
    const saved = fs.readFileSync('./players.json', 'utf8');
    const data = JSON.parse(saved);
    data.players.forEach(([id, player]) => players.set(id, player));
    leaderboard.push(...data.leaderboard);
} catch (e) {
    console.log('Новый файл данных будет создан');
}

// Сохранение данных
function saveData() {
    const data = {
        players: Array.from(players.entries()),
        leaderboard: leaderboard
    };
    fs.writeFileSync('./players.json', JSON.stringify(data, null, 2));
}

// Сохраняем каждые 5 минут
setInterval(saveData, 300000);

// ============ КОМАНДЫ БОТА ============

// Стартовая команда
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || `${msg.from.first_name} ${msg.from.last_name || ''}`.trim();
    
    // Создаем или получаем игрока
    if (!players.has(userId)) {
        players.set(userId, {
            id: userId,
            name: username,
            bitcoins: 100,
            serversHacked: 0,
            powerLevel: 1,
            stealthLevel: 1,
            arenaWins: 0,
            arenaLosses: 0,
            joinDate: new Date().toISOString()
        });
        updateLeaderboard(userId);
    }
    
    const player = players.get(userId);
    
    const keyboard = {
        inline_keyboard: [
            [{ text: '🎮 ИГРАТЬ В WEB-АПП', web_app: { url: `https://your-domain.com/game?user=${userId}` } }],
            [{ text: '📊 МОЯ СТАТИСТИКА', callback_data: 'stats' }],
            [{ text: '🏆 ТАБЛИЦА ЛИДЕРОВ', callback_data: 'leaderboard' }],
            [{ text: '📖 ПОМОЩЬ', callback_data: 'help' }]
        ]
    };
    
    bot.sendMessage(chatId, 
        `🔐 *ДОБРО ПОЖАЛОВАТЬ В HACKER'S TERMINAL!* 🔐\n\n` +
        `Привет, *${player.name}*!\n\n` +
        `Ты начинающий хакер с 100 BTC в кармане. Взламывай сервера, ` +
        `прокачивай навыки и поднимайся в топе!\n\n` +
        `💰 Баланс: ${player.bitcoins} BTC\n` +
        `💻 Взломано серверов: ${player.serversHacked}\n` +
        `⚡ Уровень: ${player.powerLevel}\n\n` +
        `*Нажми "ИГРАТЬ В WEB-АПП" чтобы начать!*`,
        {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        }
    );
});

// Обработка callback кнопок
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    
    if (!players.has(userId)) {
        bot.answerCallbackQuery(query.id, { text: '❌ Сначала запусти бота через /start' });
        return;
    }
    
    const player = players.get(userId);
    
    switch(data) {
        case 'stats':
            showStats(chatId, query.id, player);
            break;
        case 'leaderboard':
            showLeaderboard(chatId, query.id);
            break;
        case 'help':
            showHelp(chatId, query.id);
            break;
    }
});

function showStats(chatId, queryId, player) {
    const stats = 
        `📊 *ТВОЯ СТАТИСТИКА*\n\n` +
        `👤 Имя: ${player.name}\n` +
        `💰 Биткоины: ${player.bitcoins} BTC\n` +
        `💻 Взломано серверов: ${player.serversHacked}\n` +
        `⚡ Уровень мощности: ${player.powerLevel}\n` +
        `🕵️ Уровень скрытности: ${player.stealthLevel}\n` +
        `🏆 Побед в арене: ${player.arenaWins}\n` +
        `💔 Поражений в арене: ${player.arenaLosses}\n` +
        `📅 В игре с: ${new Date(player.joinDate).toLocaleDateString('ru-RU')}`;
    
    bot.answerCallbackQuery(queryId);
    bot.sendMessage(chatId, stats, { parse_mode: 'Markdown' });
}

function showLeaderboard(chatId, queryId) {
    const topPlayers = leaderboard.slice(0, 10);
    
    if (topPlayers.length === 0) {
        bot.answerCallbackQuery(queryId);
        bot.sendMessage(chatId, '🏆 Таблица лидеров пока пуста! Стань первым!');
        return;
    }
    
    let leaderboardText = '🏆 *ТОП-10 ХАКЕРОВ* 🏆\n\n';
    
    topPlayers.forEach((player, index) => {
        const medal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : `${index + 1}.`));
        leaderboardText += `${medal} *${player.name}*\n`;
        leaderboardText += `   💰 ${player.bitcoins} BTC | 💻 ${player.serversHacked} | ⚔️ ${player.arenaWins}\n`;
    });
    
    bot.answerCallbackQuery(queryId);
    bot.sendMessage(chatId, leaderboardText, { parse_mode: 'Markdown' });
}

function showHelp(chatId, queryId) {
    const help = 
        `📖 *ПОМОЩЬ ПО ИГРЕ*\n\n` +
        `*🎮 ОСНОВНОЙ ГЕЙМПЛЕЙ:*\n` +
        `• Нажимай "ВЗЛОМАТЬ" чтобы зарабатывать BTC\n` +
        `• Прокачивай мощность для большего профита\n` +
        `• Улучшай скрытность чтобы не попадаться\n\n` +
        `*🤖 ПОМОЩНИКИ:*\n` +
        `• Майнер - пассивный доход\n` +
        `• Хакер - увеличивает мощность\n` +
        `• ИИ - комбинированный бонус\n` +
        `• Призрак - снижает риск\n\n` +
        `*⚔️ PVP АРЕНА:*\n` +
        `• Открывается при 1000 BTC\n` +
        `• Делай ставки и взламывай других хакеров\n` +
        `• Чем выше сложность, тем больше множитель\n\n` +
        `*🏆 ЛИДЕРБОРД:*\n` +
        `• Соревнуйся с другими игроками\n` +
        `• Топ-50 обновляется автоматически\n` +
        `• Побеждай в арене чтобы подняться в рейтинге`;
    
    bot.answerCallbackQuery(queryId);
    bot.sendMessage(chatId, help, { parse_mode: 'Markdown' });
}

// Обновление лидерборда
function updateLeaderboard(userId) {
    const player = players.get(userId);
    if (!player) return;
    
    const index = leaderboard.findIndex(p => p.id === userId);
    const playerData = {
        id: userId,
        name: player.name,
        bitcoins: player.bitcoins,
        serversHacked: player.serversHacked,
        powerLevel: player.powerLevel,
        arenaWins: player.arenaWins
    };
    
    if (index >= 0) {
        leaderboard[index] = playerData;
    } else {
        leaderboard.push(playerData);
    }
    
    // Сортируем по биткоинам
    leaderboard.sort((a, b) => b.bitcoins - a.bitcoins);
    
    // Оставляем топ-50
    if (leaderboard.length > 50) {
        leaderboard.length = 50;
    }
}

// ============ API ДЛЯ WEB-АПП ============

app.use(express.json());
app.use(express.static('public'));

// Получение данных игрока
app.get('/api/player/:userId', (req, res) => {
    const userId = req.params.userId;
    const player = players.get(userId);
    
    if (player) {
        res.json(player);
    } else {
        res.status(404).json({ error: 'Игрок не найден' });
    }
});

// Обновление данных игрока
app.post('/api/player/:userId', (req, res) => {
    const userId = req.params.userId;
    const data = req.body;
    
    if (players.has(userId)) {
        const player = players.get(userId);
        Object.assign(player, data);
        players.set(userId, player);
        updateLeaderboard(userId);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Игрок не найден' });
    }
});

// Получение лидерборда
app.get('/api/leaderboard', (req, res) => {
    res.json(leaderboard.slice(0, 50));
});

// Получение ранга игрока
app.get('/api/rank/:userId', (req, res) => {
    const userId = req.params.userId;
    const rank = leaderboard.findIndex(p => p.id == userId) + 1;
    res.json({ rank: rank > 0 ? rank : null });
});

// Отправка уведомления игроку
app.post('/api/notify/:userId', (req, res) => {
    const userId = req.params.userId;
    const { message } = req.body;
    
    bot.sendMessage(userId, message).then(() => {
        res.json({ success: true });
    }).catch(() => {
        res.status(500).json({ error: 'Не удалось отправить уведомление' });
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});

// Обработка ошибок
bot.on('polling_error', (error) => {
    console.log('Polling error:', error);
});
