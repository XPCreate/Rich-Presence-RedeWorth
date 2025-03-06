const presence = {
    config: {
        details: 'Servidor Offline 🔴',
        state: 'ip: redeworth.com',
        largeImageKey: 'logo',
        largeImageText: '⭐ Venha fazer parte da Rede Worth você também ⭐',
        smallImageKey: 'spall_image',
        smallImageText: 'nickname',
        partySize: 0,
        partyMax: 0,
        instance: true,
        buttons: [
            { label: '🔴 Conectar', url: 'minecraft://redeworth.com:25565' },
            { label: 'Discord', url: 'https://discord.gg/ezphhH9BKj' }
        ],
    },
};

let currentClients = {};
let isMinecraftRunning = false;
let tlAuth = false;

const detectMinecraftClients = () => {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
        const platformTaskInfo = process.platform === 'win32' ? 'tasklist' : 'ps aux';
        exec(platformTaskInfo, (error, stdout, stderr) => {
            if (error || stderr) return reject(`Erro ao listar processos: ${error || stderr}`);

            const clients = [
                { name: 'Lunar Client', process: 'Lunar' },
                { name: 'Badlion', process: 'Badlion' },
                { name: 'CMPack', process: 'CMPack' },
                { name: 'ATLauncher', process: 'AtLauncher' },
                { name: 'TLauncher', process: 'java.exe' },
                { name: 'Minecraft', process: 'Minecraft' },
                { name: 'MultiMC', process: 'MultiMC' },
                { name: 'LabyMod', process: 'LabyMod' },
                { name: 'Forge', process: 'Forge' },
                { name: 'Technic Launcher', process: 'Technic' },
                { name: 'Sklauncher', process: 'Sklauncher' }
            ];

            let detectedClients = [];

            clients.forEach(client => {
                if (stdout.includes(client.process)) {
                    if (!currentClients[client.name]) {
                        currentClients[client.name] = true;
                        console.log(`[DEBUG] - Cliente ${client.name} foi aberto!`);
                    }
                    detectedClients.push(client.name);
                } else if (currentClients[client.name]) {
                    currentClients[client.name] = false;
                    console.log(`[DEBUG] - Cliente ${client.name} foi fechado!`);
                }
            });

            const isMinecraftOpen = stdout.includes(process.platform === 'win32' ? 'javaw.exe' : 'Minecraft');
            if (!stdout.includes('java.exe')) isMinecraftRunning = isMinecraftOpen;

            if (isMinecraftOpen !== tlAuth) {
                console.log(`[DEBUG] - Minecraft foi ${isMinecraftOpen ? 'aberto' : 'fechado'}!`);
                tlAuth = isMinecraftOpen;
            }

            resolve(detectedClients);
        });
    });
};

module.exports.presence = async (nick, configData) => {
    if (nick !== 'Desconhecido' && configData.nickname !== 'Desconhecido') {
        if (configData.nickname) nick = configData.nickname;
    }

    try {
        const clients = await detectMinecraftClients();
        const response = await fetch('https://api.mcsrvstat.us/3/redeworth.com');

        if (!response.ok) {
            console.log('[DEBUG_LOG] - Falha ao conectar ao Minecraft Status API, mesmo assim estamos enviado os dados salvos anteriormente.');
            return presence.config;
        }

        const data = await response.json();
        presence.config.startTimestamp = (configData.showTimeActivities === true) ?
            new Date(configData.editTimeActivitiesProfile).getTime() :
            new Date().getTime() + (24 * 60 * 60 * 1000);

        presence.config.state = configData.showClient ?
            `ip: redeworth.com${isMinecraftRunning ? ' | ' + clients.join(', ') : ''}` :
            'ip: redeworth.com';

        presence.config.details = data.motd?.clean[0] || 'Servidor Offline 🔴';
        presence.config.buttons[0].label = data.motd?.clean[0]?.includes('Estamos em manutenção!') ? '🟡 Conectar' :
            data.motd ? '🟢 Conectar' : '🔴 Conectar';

        presence.config.partySize = configData.showPlayers ? Math.floor(data.players.online / 2) || 0 : 0;
        presence.config.partyMax = configData.showPlayers ? (data.players.online ? data.players.max : 0) : 0;

        presence.config.smallImageKey = [
            'vitorxp', 'MihawkRevex', 'Draccount', 'MuriloRevex', 'lkttjota',
            'Menino_Tutuh', 'ShimizuMimi', 'MoonSpy_', 'Neto33rec'
        ].includes(nick) ? nick.toLowerCase() : 'usernick';
        presence.config.smallImageText = nick || 'Desconhecido';

        return presence.config;
    } catch (err) {
        console.error(`[ERROR] - ${err.message} (tentando em 15s)`);
        return presence.config;
    }
};