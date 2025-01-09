const presence = {
    config: {
        details: 'Servidor Offline 🔴',
        state: 'ip: redesky.net',
        startTimestamp: Date.now(),
        largeImageKey: 'logo',
        largeImageText: '⭐ Venha fazer parte da Rede Worth você também ⭐',
        smallImageKey: 'spall_image',
        smallImageText: 'nickname',
        partySize: 0,
        partyMax: 0,
        instance: true,
        buttons: [
            {
                label: '🟢 Conectar',
                url: 'minecraft://redesky.net:255565',
            },
            {
                label: "Discord",
                url:"https://discord.gg/WhA7CFcENT"
            }
        ],
    },
};

let currentClients = {};
let isMinecraftRunning = false;
let tlAuth = false

const detectMinecraftClients = () => {
    const { exec } = require('child_process');

    return new Promise((resolve, reject) => {

        exec('tasklist', (error, stdout, stderr) => {

            if (error || stderr) {
                return reject('Erro ao listar processos:', error || stderr);
            }

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
                { name: 'Sklauncher', process: 'Sklauncher' },
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

            const isMinecraftOpen = stdout.includes('javaw.exe');

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

module.exports.presence = async (nick) => {
    try {
        const clients = await detectMinecraftClients();
        const response = await fetch('https://api.mcsrvstat.us/3/redesky.net');
        if (response.status === 200) {
            const data = await response.json();
            presence.config.state = `ip: redesky.net${isMinecraftRunning ? ' | ' + clients.join(', ') : ''}.`;
            presence.config.details = data.motd ? data.motd.clean[0] : "Servidor Offline 🔴.";
            presence.config.partySize = data.motd ? data.players.online / 2 : 0;
            presence.config.partyMax = data.motd ? data.players.max : 0;

            if (nick) {
                presence.config.smallImageKey = "usernick";
                presence.config.smallImageText = nick;
            }
        }

        return presence.config;
    } catch (err) {
        console.error(err);
        return presence.config;
    }
};