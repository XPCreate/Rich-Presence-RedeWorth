
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
            {
                label: '🔴 Conectar',
                url: 'minecraft://redeworth.com:25565',
            },
            {
                label: "Discord",
                url: "https://discord.gg/ezphhH9BKj"
            }
        ],
    },
};

let currentClients = {};
let isMinecraftRunning = false;
let tlAuth = false;

const detectMinecraftClients = () => {
    const { exec } = require('child_process');

    return new Promise((resolve, reject) => {
        const platformTaskInfo = process.platform === "win32" ? "tasklist" : "ps aux";
        exec(platformTaskInfo, (error, stdout, stderr) => {
            if (error || stderr) {
                return reject('Erro ao listar processos:', error || stderr);
            }

            const clients = [
                { name: 'Lunar Client', process: process.platform === "win32" ? "Lunar" : "lunar" },
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
            let detectedProcess = false;

            clients.forEach(client => {
                if (stdout.includes(client.process)) {
                    detectedClients.push(client.name);
                    detectedProcess = true;

                    if (!currentClients[client.name]) {
                        currentClients[client.name] = true;
                        console.log(`[DEBUG] - Cliente ${client.name} foi aberto!`);
                    }
                } else if (currentClients[client.name]) {
                    currentClients[client.name] = false;
                    console.log(`[DEBUG] - Cliente ${client.name} foi fechado!`);
                }
            });

            const isMinecraftOpen = stdout.includes(process.platform === "win32" ? "javaw.exe" : "Minecraft");

            if (!stdout.includes("java.exe")) isMinecraftRunning = isMinecraftOpen;
            if (isMinecraftOpen) {
                if (tlAuth !== true) console.log('[DEBUG] - Minecraft foi aberto!');
                tlAuth = true;
            } else {
                if (tlAuth !== false) console.log('[DEBUG] - Minecraft foi fechado!');
                tlAuth = false;
            }

            resolve(detectedClients);
        });
    });
};

module.exports.presence = async (nick, configData) => {
    if(nick !== "Desconhecido") {
        if(configData.nickname === "Desconhecido");
        else nick = configData.nickname;
    }

    try {
        const clients = await detectMinecraftClients();
        const response = await fetch('https://api.mcsrvstat.us/3/redeworth.com');
        if (response.status === 200) {
            const data = await response.json();

            if (configData.showTimeActivities === true || configData.showTimeActivities === "true") {
                presence.config.startTimestamp = new Date(configData.editTimeActivitiesProfile).getTime();
            } else {
                presence.config.startTimestamp = new Date(configData.editTimeActivitiesProfile).getTime() + (24 * 60 * 60 * 1000);
            }
            if (configData.showClient === true || configData.showClient === "true") presence.config.state = `ip: redeworth.com${isMinecraftRunning ? ' | ' + clients.join(', ') : ''}.`;
            else presence.config.state = `ip: redeworth.com`;

            presence.config.details = data.motd ? data.motd.clean[0] : "Servidor Offline 🔴.";
            presence.config.buttons[0].label = data.motd ? "🟢 Conectar" : "🔴 Conectar";

            if (String(data.motd.clean[0]).includes("Estamos em manutenção!")) presence.config.buttons[0].label = "🟡 Conectar";

            presence.config.partySize = data.motd ? data.players.online / 2 : 0;
            presence.config.partyMax = data.motd ? (data.players.online !== 0 ? data.players.max : 0) : 0;

            if (["vitorxp", "MihawkRevex", "Draccount", "MuriloRevex", "lkttjota", "Menino_Tutuh", "ShimizuMimi", "MoonSpy_", "Neto33rec"].includes(nick)) {
                presence.config.smallImageKey = `${String(nick).toLowerCase()}`;
                presence.config.smallImageText = String(nick || "Desconhecido");
            } else {
                presence.config.smallImageKey = `usernick`;
                presence.config.smallImageText = String(nick || "Desconhecido");
            }
        } else {
            console.error('[ERROR] - Falha ao conectar ao Minecraft Status API. (tentando em 15s)');
            return presence.config;
        }

        return presence.config;
    } catch (err) {
        return presence.config;
    }
};