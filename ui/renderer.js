const { ipcRenderer } = require('electron');
const peq = require("../package.json");

let downloadNewVersion;
let dateOnActivities = 0;
let dateReloadStatus = 0;
let dateOnActivitieMinecraft = 0;
let nickname = "";

const formatTimeDifference = (timestamp) => {
    let diff = Date.now() - timestamp;
    const units = [
        { label: 'd', value: 1000 * 60 * 60 * 24 },
        { label: 'h', value: 1000 * 60 * 60 },
        { label: 'm', value: 1000 * 60 },
        { label: 's', value: 1000 }
    ];

    return units.map(({ label, value }) => {
        const amount = Math.floor(diff / value);
        diff %= value;
        return amount > 0 ? `${amount}${label} ` : '';
    }).join('').trim();
};

const formatMemoryUsage = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)}MiB de RAM`;

const toggleElementsDisplay = (elements, display) => {
    Array.from(elements).forEach(el => el.style.display = display);
};

const handleRPCAction = (action) => {
    const nickInput = document.getElementById("nick-input").value.trim();
    const elements = document.getElementsByClassName("wedfr-d3");
    
    if (nickname === "") nickname = nickInput;

    if (!nickname || nickname === " " || nickname === ""){
        toggleElementsDisplay(elements, "flex");
        return;
    } else if (nickname.length < 3) {
        showError("Coloque um nickname maior que 3 letras.");
        document.getElementById("nick-input").focus();
        return;
    }

    toggleElementsDisplay(elements, "none");

    if (action === 'start' || action === 'reload') {
        ; showError("Iniciada com sucesso!");
        document.getElementById('startRPC').disabled = true;
    }
    if (action === 'reload') {
        ; showError("Reiniciada com sucesso!");
        document.getElementById('reloadRPC').disabled = true;
        document.getElementById('stopRPC').disabled = true;
    }
    if (action === 'stop') {
        ; showError("Parada com sucesso!");
        document.getElementById('reloadRPC').disabled = true;
        document.getElementById('stopRPC').disabled = true;
        document.getElementById('startRPC').disabled = false;
        dateOnActivities = 0;
        dateReloadStatus = 0;
    }

    if (action === "reload") action = "start";

    var editTimeActivitiesProfile = document.getElementById('editTimeActivitiesProfile').value;
    var showClient = document.getElementById('showClient').checked;
    var showTimeActivities = document.getElementById('showTimeActivities').checked;

    ipcRenderer.send(`${action}RPC`, nickname);

    ipcRenderer.send(`config`, {
        editTimeActivitiesProfile,
        showClient,
        showTimeActivities,
        nickname
    });
};

const showError = (message) => {
    const errorMessage = document.createElement('ndasc');
    errorMessage.classList.add('error-message');
    errorMessage.textContent = message;
    document.body.appendChild(errorMessage);

    setTimeout(() => errorMessage.remove(), 3000);
};

const updateServerInfo = async () => {
    try {
        const response = await fetch('https://api.mcsrvstat.us/3/redeworth.com');
        const data = response.ok ? await response.json() : { players: { online: 0 } };
        document.getElementById("statusServer").textContent = data.players.online ? `🟢 Status: Online` : `🔴 Status: Offline`;
        document.getElementById("playersServer").textContent = `Jogadores Online: ${data.players.online / 2}`;
    } catch (error) {
        document.getElementById("statusServer").textContent = `🔴 Status: Offline`;
        document.getElementById("playersServer").textContent = `Jogadores Online: 0`;
    }
};

const checkForUpdates = async () => {
    Array.from(document.getElementsByClassName("wedfr")).forEach(el => el.style.display = "none");

    try {
        const response = await fetch('https://api.github.com/repos/XPCreate/Rich-Presence-RedeWorth/releases/latest');
        if (!response.ok) return;

        const data = await response.json();
        if (!data.tag_name) return;

        const latestVersion = data.tag_name;
        const localVersion = `v${peq.version}`;

        if (localVersion !== latestVersion) {
            downloadNewVersion = data.assets[0]?.browser_download_url;
            toggleElementsDisplay(document.getElementsByClassName("f43fd"), "block");
        } else {
            toggleElementsDisplay(document.getElementsByClassName("f43fd"), "none");
            downloadNewVersion = "";
        }
    } catch (err) {
        console.error("Error checking for updates:", err);
    }
};

document.getElementById('startRPC').addEventListener('click', () => handleRPCAction('start'));
document.getElementById('startRPC2').addEventListener('click', () => handleRPCAction('start'));
document.getElementById('reloadRPC').addEventListener('click', () => handleRPCAction('reload'));
document.getElementById('stopRPC').addEventListener('click', () => handleRPCAction('stop'));
document.getElementById('f43fd').addEventListener('click', () => {
    if (downloadNewVersion) window.open(downloadNewVersion, "_blank");
});
document.getElementById('saveConfig').addEventListener('click', () => {
    var editTimeActivitiesProfile = document.getElementById('editTimeActivitiesProfile').value;
    var showClient = document.getElementById('showClient').checked;
    var showTimeActivities = document.getElementById('showTimeActivities').checked;
    var nickInput = document.getElementById("editNick").value;

    if (nickInput.length < 3) {
        showError("Coloque um nickname maior que 3 letras.");
        return;
    }

    nickname = nickInput;

    ipcRenderer.send(`config`, {
        editTimeActivitiesProfile,
        showClient,
        showTimeActivities,
        nickname
    });

    toggleElementsDisplay(document.getElementsByClassName("wedfr-d3f4"), "none");
    showError("Configurações salvas.");
});
document.getElementById('configButton').addEventListener('click', () => {
    document.getElementById("editNick").value = nickname;
    toggleElementsDisplay(document.getElementsByClassName("wedfr-d3f4"), "flex");

});

ipcRenderer.on('terminal-output', (event, data) => {
    const terminalDiv = document.getElementById('terminal');
    const colors = {
        "[0;33m": "#ffcc00",
        "[0;37m-": "#ffffff",
        "[0;36m ": "#00ffff",
        "[0;35m ": "#ff00ff",
        "[0;32m": "#00ff00"
    };

    const color = Object.keys(colors).find(key => data.includes(key)) || "#ffffff";
    terminalDiv.innerHTML += `<p style="color: ${colors[color]}">${String(data).replace(/\x1B\[[0-9;]*[mK]/g, '')}</p>`;
    terminalDiv.scrollTop = terminalDiv.scrollHeight;
});

ipcRenderer.on('versionAPP', (event, data) => {
    document.getElementById('versionAPP').textContent = data;
});

ipcRenderer.on('startRPC', () => {
    document.getElementById('reloadRPC').disabled = false;
    document.getElementById('stopRPC').disabled = false;
    dateOnActivities = Date.now();
    dateReloadStatus = 16;

    let currentDate = new Date();
    let formattedDate = currentDate.toLocaleString("en-CA", {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(',', '');

    if (document.getElementById("editTimeActivitiesProfile").value === "" || document.getElementById("editTimeActivitiesProfile").value === " " || !document.getElementById("editTimeActivitiesProfile").value) document.getElementById("editTimeActivitiesProfile").value = formattedDate;
});

ipcRenderer.on('MemoryUsed', (event, data) => {
    document.getElementById('MemoryRamUsed').textContent = formatMemoryUsage(data.heapUsed);
});

ipcRenderer.on('activities-minecraft', (event, data) => {
    dateOnActivitieMinecraft = data;
})

setInterval(() => {
    if (dateOnActivities) {
        document.getElementById('dateOnActivities').textContent = formatTimeDifference(dateOnActivities);
        if (!dateReloadStatus) dateReloadStatus = 16;
    } else {
        document.getElementById('dateOnActivities').textContent = "Ainda não foi iniciado..."
    }

    if (dateOnActivitieMinecraft) {
        document.getElementById('dateOnMinecraft').textContent = formatTimeDifference(dateOnActivitieMinecraft);
    } else {
        document.getElementById('dateOnMinecraft').textContent = "Não foi aberto ainda..."
    }

    if (dateReloadStatus) {
        dateReloadStatus--;
        document.getElementById('dateReloadStatus').textContent = `${dateReloadStatus}s`;
    } else {
        document.getElementById('dateReloadStatus').textContent = "Nenhum";
    }
}, 1000);

setTimeout(updateServerInfo, 1000);
setInterval(updateServerInfo, 10000);

setTimeout(checkForUpdates, 1900);

document.addEventListener('keydown', (event) => {
    if (event.key === "Escape") {
        toggleElementsDisplay(document.getElementsByClassName("wedfr-d3"), "none");
        toggleElementsDisplay(document.getElementsByClassName("wedfr-d3f4"), "none");
    }
});
