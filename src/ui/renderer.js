const { ipcRenderer } = require('electron');
const peq = require("../../package.json");


let csfg = false;
let downloadNewVersion;
let dateOnActivities = 0;
let dateReloadStatus = 0;
let dateOnActivitieMinecraft = 0;
let nickname = "";
let startRPC;
let jqwerftj = document.getElementById("showActivitiesReal").checked;
let dsaf34r = document.getElementById("editTimeActivitiesProfile").value;

const formatTimeDifference = (timestamp) => {
    let diff = Date.now() - timestamp;
    const units = [
        {
            label: 'd',
            value: 1000 * 60 * 60 * 24
        },
        {
            label: 'h',
            value: 1000 * 60 * 60
        },
        {
            label: 'm',
            value: 1000 * 60
        },
        {
            label: 's',
            value: 1000
        }
    ];

    return units.map(({ label, value }) => {
        const amount = Math.floor(diff / value);
        diff %= value;
        return amount > 0
            ? `${amount}${label} `
            : '';
    }).join('').trim();
};

const formatMemoryUsage = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)}MiB de RAM`;

const toggleElementsDisplay = (elements, display) => {
    Array.from(elements).forEach(el => el.style.transition = "0.3s");
    Array.from(elements).forEach(el => el.style["animation-duration"] = "0.3s");
    Array.from(elements).forEach(el => el.style.opacity = 0);

    if (display === "block" || display === "flex") {
        Array.from(elements).forEach(el => el.style.display = display);
        setTimeout(() => {
            Array.from(elements).forEach(el => el.style.opacity = 1);
        }, 100)
    } else if (display === "none") {
        Array.from(elements).forEach(el => el.style.opacity = 0);
        setTimeout(() => {
            Array.from(elements).forEach(el => el.style.display = display);
        }, 210)
    }
};

const handleRPCAction = (action) => {
    const nickInput = document.getElementById("nick-input").value.trim();
    const elements = document.getElementsByClassName("wedfr-d3");

    if (nickname === "") nickname = nickInput;

    if (!nickname || nickname === " " || nickname === "") {
        showClientConfig()
        return;
    } else if (nickname.length < 3) {
        showError("Coloque um nickname maior que 3 letras.");
        document.getElementById("editNick").focus()
        showClientConfig()
        return;
    }

    toggleElementsDisplay(elements, "none");

    if (action === 'start' || action === 'reload') {
        showError("Iniciada com sucesso!");
        document.getElementById('startRPC').disabled = true;
    }
    if (action === 'reload') {
        showError("Reiniciada com sucesso!");
        document.getElementById('reloadRPC').disabled = true;
        document.getElementById('stopRPC').disabled = true;
    }
    if (action === 'stop') {
        showError("Parada com sucesso!");
        document.getElementById('reloadRPC').disabled = true;
        document.getElementById('stopRPC').disabled = true;
        document.getElementById('startRPC').disabled = false;
        dateOnActivities = 0;
        dateReloadStatus = 0;
    }

    if (action === "reload") action = "start";

    var editTimeActivitiesProfile = document.getElementById('editTimeActivitiesProfile').value;
    var showClient = document.getElementById('showClient').checked;
    var showPlayers = document.getElementById('showPlayers').checked;
    var showTimeActivities = document.getElementById('showTimeActivities').checked;
    var showActivitiesReal = document.getElementById("showActivitiesReal").checked;

    ipcRenderer.send(`${action}RPC`, nickname);

    ipcRenderer.send(`config`, {
        showActivitiesReal,
        editTimeActivitiesProfile,
        showClient,
        showPlayers,
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
        document.getElementById("playersServer").textContent = `Jogadores Online: ${Math.floor(data.players.online).toPrecision()}`;
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
            if (Number(String(latestVersion).replaceAll(".", "").replace("v", "")) <= Number(String(localVersion).replaceAll(".", "").replace("v", ""))) { return; }
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

document.getElementById("showTimeActivities").addEventListener("click", function () {
    var showTimeActivities = document.getElementById('showTimeActivities').checked;

    if (showTimeActivities === true) {
        document.getElementById('editTimeActivitiesProfile').disabled = false;
    } else {
        document.getElementById('editTimeActivitiesProfile').disabled = true;
    }
});
document.getElementById('editNick').addEventListener('keyup', () => {
    var nick = String(document.getElementById('editNick').value).slice();
    document.getElementById('headNickname').src = `https://mc-heads.net/avatar/${nick}/16x16`;
});
document.getElementById('startRPC').addEventListener('click', () => handleRPCAction('start'));
document.getElementById('startRPC2').addEventListener('click', () => handleRPCAction('start'));
document.getElementById('reloadRPC').addEventListener('click', () => handleRPCAction('reload'));
document.getElementById('stopRPC').addEventListener('click', () => handleRPCAction('stop'));
document.getElementById('f43fd').addEventListener('click', () => {
    ipcRenderer.send("updateVersionApp", {})
});
document.getElementById('saveConfig').addEventListener('click', () => {
    var editTimeActivitiesProfile = document.getElementById('editTimeActivitiesProfile').value;
    var showClient = document.getElementById('showClient').checked;
    var showPlayers = document.getElementById('showPlayers').checked;
    var showTimeActivities = document.getElementById('showTimeActivities').checked;
    var nickInput = document.getElementById("editNick").value;
    var showActivitiesReal = document.getElementById("showActivitiesReal").checked;

    if (nickInput.length < 3) {
        showError("Coloque um nickname maior que 3 letras.");
        document.getElementById("editNick").focus()
        return;
    }

    nickname = nickInput;

    ipcRenderer.send(`config`, {
        showActivitiesReal,
        editTimeActivitiesProfile,
        showClient,
        showPlayers,
        showTimeActivities,
        nickname
    });

    toggleElementsDisplay(document.getElementsByClassName("wedfr-d3f4"), "none");
    csfg = false
    showError("Configurações salvas.");
});
document.getElementById('configButton').addEventListener('click', () => {
    showClientConfig()

});

document.getElementById('configAppButton').addEventListener('click', () => {
    csfg = true
    toggleElementsDisplay(document.getElementsByClassName("wedfr-d32"), "flex");
});

document.getElementById('closeConfigApp').addEventListener('click', () => {
    csfg = false
    toggleElementsDisplay(document.getElementsByClassName("wedfr-d32"), "none");
});

document.getElementById('closeConfig').addEventListener('click', () => {
    csfg = false
    toggleElementsDisplay(document.getElementsByClassName("wedfr-d3f4"), "none");
});


document.getElementById("minimizeToTray").addEventListener("click", function () {
    systemUpdateConfigApp();
});

document.getElementById("runAppToMin").addEventListener("click", function () {
    systemUpdateConfigApp();
});

document.getElementById("closeAppGameInt").addEventListener("click", function () {
    systemUpdateConfigApp();
});

document.getElementById("pixelFormatApp1").addEventListener("keyup", function () {
    systemUpdateConfigApp();
});

document.getElementById("pixelFormatApp2").addEventListener("keyup", function () {
    systemUpdateConfigApp();
});

document.getElementById("editTimeActivitiesProfile").addEventListener("change", function () {
    if (dsaf34r !== document.getElementById("editTimeActivitiesProfile").value) {
        document.getElementById("showActivitiesReal").checked = false
        ipcRenderer.send(`config`, {
            showActivitiesReal: false,
            editTimeActivitiesProfile,
            showClient,
            showPlayers,
            showTimeActivities,
            nickname
        });
    }
})

document.getElementById("showActivitiesReal").addEventListener("click", function () {
    ipcRenderer.send(`config`, {
        showActivitiesReal: document.getElementById("showActivitiesReal").checked,
        editTimeActivitiesProfile,
        showClient,
        showPlayers,
        showTimeActivities,
        nickname
    });

    document.getElementById('editTimeActivitiesProfile').value = new Date(startRPC).toLocaleString("en-CA", {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(',', '');
})

document.getElementById("openConfigRich").addEventListener("click", (event) => {
    toggleElementsDisplay(document.getElementsByClassName("wedfr-d3"), "none");
    toggleElementsDisplay(document.getElementsByClassName("wedfr-d3f4"), "flex");
    toggleElementsDisplay(document.getElementsByClassName("wedfr-d32"), "none");
})

document.getElementById("AppStartRich").addEventListener("click", () => {
    systemUpdateConfigApp();
})

function systemUpdateConfigApp() {
    var runAppToMin = document.getElementById('runAppToMin').checked;
    var minimizeToTray = document.getElementById('minimizeToTray').checked;
    var closeAppGameInt = document.getElementById('closeAppGameInt').checked;
    var pixelFormatApp1 = document.getElementById('pixelFormatApp1').value;
    var pixelFormatApp2 = document.getElementById('pixelFormatApp2').value;
    var AppStartRich = document.getElementById("AppStartRich").checked;

    ipcRenderer.send(`configApp`, {
        minimizeToTray,
        runAppToMin,
        closeAppGameInt,
        pixelFormatApp1,
        pixelFormatApp2,
        AppStartRich
    });
}

function showClientConfig() {
    csfg = true;
    document.getElementById("editNick").value = nickname;
    toggleElementsDisplay(document.getElementsByClassName("wedfr-d3f4"), "flex");
}

function btnConfigAppCategory(element) {    
    var value = element.name;
    document.getElementById("vhu3d").value = "false";
    document.getElementById("vhu3df").value = "false";
    element.value = "true"

    if (value === "app") {
        document.getElementById("abv2").style.display = "none";
        document.getElementById("abv1").style.display = "block";
    } else {
        document.getElementById("abv1").style.display = "none";
        document.getElementById("abv2").style.display = "block";
    }
}

ipcRenderer.on('terminal-output', (event, data) => {
    const terminalDiv = document.getElementById('terminal');
    const colors = {
        "[0;31m": "red",
        "[0;33m": "#ffcc00",
        "[0;37m-": "#ffffff",
        "[0;36m ": "#00ffff",
        "[0;35m ": "#ff00ff",
        "[0;32m": "#00ff00"
    };

    const color = Object.keys(colors).find(key => data.includes(key)) || "#ffffff";
    terminalDiv.innerHTML += `<p style="color: ${colors[color]}">${String(data).replace(/\x1B\[[0-9;]*[mK]/g, '')}</p>`;
    terminalDiv.scrollTop = terminalDiv.scrollHeight;

    if (String(data).includes("Atividade desativada com sucesso.")) {
        document.getElementById('reloadRPC').disabled = true;
        document.getElementById('stopRPC').disabled = true;
        document.getElementById('startRPC').disabled = false;
        dateOnActivities = 0;
        dateReloadStatus = 0;
        dateOnActivitieMinecraft = 0;
    }
});

ipcRenderer.on('versionAPP', (event, data) => {
    document.getElementById('versionAPP').textContent = data;
});

ipcRenderer.on('startRPC', (event, data) => {
    if (jqwerftj === true) {
        document.getElementById("editTimeActivitiesProfile").value = new Date(startRPC).toLocaleString("en-CA", {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', '');
    }

    startRPC = data.timeStart;
    document.getElementById('reloadRPC').disabled = false;
    document.getElementById('stopRPC').disabled = false;
    document.getElementById('startRPC').disabled = true;
    dateOnActivities = Date.now() - 1000;

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

    var editTimeActivitiesProfile = document.getElementById('editTimeActivitiesProfile').value;
    var showClient = document.getElementById('showClient').checked;
    var showPlayers = document.getElementById('showPlayers').checked;
    var showTimeActivities = document.getElementById('showTimeActivities').checked;
    var showActivitiesReal = document.getElementById("showActivitiesReal").checked;

    ipcRenderer.send(`config`, {
        showActivitiesReal,
        editTimeActivitiesProfile,
        showClient,
        showPlayers,
        showTimeActivities,
        nickname
    });
});

ipcRenderer.on('MemoryUsed', (event, data) => {
    document.getElementById('MemoryRamUsed').textContent = formatMemoryUsage(data.heapUsed);
});

ipcRenderer.on('activities-minecraft', (event, data) => {
    dateOnActivitieMinecraft = data;
})

ipcRenderer.on('activities-reload-time-active', (event, data) => {
    dateReloadStatus = data;
})

ipcRenderer.on('config', (event, data) => {
    if (csfg === true) return;

    var editTimeActivitiesProfile = document.getElementById('editTimeActivitiesProfile').value;
    var showClient = document.getElementById('showClient').checked;
    var showPlayers = document.getElementById('showPlayers').checked;
    var showTimeActivities = document.getElementById('showTimeActivities').checked;
    var showActivitiesReal = document.getElementById("showActivitiesReal").checked;

    jqwerftj = data.showActivitiesReal;
    dsaf34r = data.editTimeActivitiesProfile;

    if (nickname !== data.nickname) nickname = data.nickname;
    if (nickname !== data.nickname) document.getElementById('editNick').value = nickname;
    if (showClient !== data.showClient) document.getElementById('showClient').checked = data.showClient;
    if (showPlayers !== data.showPlayers) document.getElementById('showPlayers').checked = data.showPlayers;
    if (showTimeActivities !== data.showTimeActivities) document.getElementById('showTimeActivities').checked = data.showTimeActivities;
    if (showActivitiesReal !== data.showActivitiesReal) document.getElementById('showActivitiesReal').checked = data.showActivitiesReal;
    if (editTimeActivitiesProfile !== data.editTimeActivitiesProfile) document.getElementById("editTimeActivitiesProfile").value = data.editTimeActivitiesProfile
    document.getElementById('headNickname').src = `https://mc-heads.net/avatar/${data.nickname}/16x16`;
})

ipcRenderer.on('configApp', (event, data) => {
    if (csfg === true) return;

    var minimizeToTray = document.getElementById('minimizeToTray').checked;
    var runAppToMin = document.getElementById('runAppToMin').checked;
    var closeAppGameInt = document.getElementById('closeAppGameInt').checked;
    var AppStartRich = document.getElementById('AppStartRich').checked;
    var pixelFormatApp1 = document.getElementById('pixelFormatApp1').value;
    var pixelFormatApp2 = document.getElementById('pixelFormatApp2').value;

    if (minimizeToTray !== data.minimizeToTray) document.getElementById('minimizeToTray').checked = data.minimizeToTray;
    if (runAppToMin !== data.runAppToMin) document.getElementById('runAppToMin').checked = data.runAppToMin;
    if (closeAppGameInt !== data.closeAppGameInt) document.getElementById('closeAppGameInt').checked = data.closeAppGameInt;
    if (AppStartRich !== data.AppStartRich) document.getElementById('AppStartRich').checked = data.AppStartRich;
    if (pixelFormatApp1 !== data.pixelFormatApp1) document.getElementById('pixelFormatApp1').value = data.pixelFormatApp1;
    if (pixelFormatApp2 !== data.pixelFormatApp2) document.getElementById('pixelFormatApp2').value = data.pixelFormatApp2;
})

setInterval(() => {
    if (dateOnActivities) {
        document.getElementById('dateOnActivities').textContent = formatTimeDifference(dateOnActivities);
        if (!dateReloadStatus) dateReloadStatus = 15;
    } else {
        document.getElementById('dateOnActivities').textContent = "Ainda não foi iniciado..."
    }

    if (dateOnActivitieMinecraft) {
        document.getElementById('dateOnMinecraft').textContent = formatTimeDifference(dateOnActivitieMinecraft);
    } else {
        document.getElementById('dateOnMinecraft').textContent = "Não foi aberto ainda..."
    }

    if (dateReloadStatus) {
        document.getElementById('dateReloadStatus').textContent = `${dateReloadStatus}s`;
        dateReloadStatus--;
    } else {
        document.getElementById('dateReloadStatus').textContent = "Nenhum";
    }
}, 1000);

setTimeout(updateServerInfo, 1000);
setInterval(updateServerInfo, 15000);
setTimeout(checkForUpdates, 1900);
setInterval(checkForUpdates, 30000);

document.addEventListener('keydown', (event) => {
    if (event.key === "Escape") {
        toggleElementsDisplay(document.getElementsByClassName("wedfr-d3"), "none");
        toggleElementsDisplay(document.getElementsByClassName("wedfr-d3f4"), "none");
        csfg = false
        toggleElementsDisplay(document.getElementsByClassName("wedfr-d32"), "none");
    }
});

document.getElementById("minimize-btn").addEventListener("click", () => {
    ipcRenderer.send("minimize-window");
});

document.getElementById("maximize-btn").addEventListener("click", () => {
    ipcRenderer.send("maximize-window");
});

document.getElementById("close-btn").addEventListener("click", () => {
    ipcRenderer.send("close-window");
});