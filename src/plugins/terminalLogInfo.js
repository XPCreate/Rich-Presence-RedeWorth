const fs = require('fs');
const path = require('path');

function removeColorCodes(text) {
    const colorRegex = /\x1B\[[0-?]*[ -/]*[@-~]/g;
    return text.replace(colorRegex, '');
}

const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, 'system_log.log');

const timestamp = new Date().toISOString().replace(/:/g, '-').replace('T', '_').split('.')[0];
const uniqueLogFilePath = path.join(logsDir, `${timestamp}-system.log`);

function writeLog(filePath, message) {
    fs.appendFile(filePath, message, (err) => {
        if (err) console.error('Erro ao escrever no arquivo de log:', err);
    });
}

const originalConsoleLog = console.log;
console.log = function (...args) {
    const message = `[${new Date().toISOString()}] [LOG] ${removeColorCodes(args.join(' '))}\n`;
    writeLog(logFilePath, message);
    writeLog(uniqueLogFilePath, message);
    // originalConsoleLog.apply(console, args);
};

console.warn = function (...args) {
    const message = `[${new Date().toISOString()}] [WARN] ${removeColorCodes(args.join(' '))}\n`;
    writeLog(logFilePath, message);
    writeLog(uniqueLogFilePath, message);
    // originalConsoleLog.apply(console, args);
};

console.error = function (...args) {
    const message = `[${new Date().toISOString()}] [ERROR] ${removeColorCodes(args.join(' '))}\n`;
    writeLog(logFilePath, message);
    writeLog(uniqueLogFilePath, message);
    // originalConsoleLog.apply(console, args);
};

console.debug = function (...args) {
    const message = `[${new Date().toISOString()}] [DEBUG] ${removeColorCodes(args.join(' '))}\n`;
    writeLog(logFilePath, message);
    writeLog(uniqueLogFilePath, message);
    // originalConsoleLog.apply(console, args);
};

console.info = function (...args) {
    const message = `[${new Date().toISOString()}] [INFO] ${removeColorCodes(args.join(' '))}\n`;
    writeLog(logFilePath, message);
    writeLog(uniqueLogFilePath, message);
    // originalConsoleLog.apply(console, args);
};

module.exports = console.log;
