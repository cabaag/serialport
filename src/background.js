"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var SerialPort = require("serialport");
var lib_1 = require("vue-cli-plugin-electron-builder/lib");
var port;
var mainWindow;
var retryConnection = 0;
var intervalCommands = 700;
var isDevelopment = process.env.NODE_ENV !== 'production';
electron_1.protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true } }]);
console.log('Init');
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
        if (!process.env.IS_TEST)
            mainWindow.webContents.openDevTools();
    }
    else {
        lib_1.createProtocol('app');
        // Load the index.html when not in development
        mainWindow.setMenuBarVisibility(false);
        mainWindow.loadURL('app://./index.html');
    }
    mainWindow.on('closed', function () {
        mainWindow = null;
        if (port) {
            port.close();
        }
    });
}
electron_1.app.on('ready', function () { return __awaiter(_this, void 0, void 0, function () {
    var e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(isDevelopment && !process.env.IS_TEST)) return [3 /*break*/, 4];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, lib_1.installVueDevtools()];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                e_1 = _a.sent();
                console.error('Vue Devtools failed to install:', e_1.toString());
                return [3 /*break*/, 4];
            case 4:
                createWindow();
                return [2 /*return*/];
        }
    });
}); });
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
electron_1.ipcMain.on('serialport:port:connect', function (event, args) {
    var comName = args[0];
    retryConnection = 0;
    openPort(comName, event);
});
electron_1.ipcMain.on('serialport:port:close', function (event, args) {
    port.close(function (err) {
        event.reply('serialport:port:closed');
    });
});
electron_1.ipcMain.on('serialport:list:action', function (event) {
    SerialPort.list().then(function (ports) {
        event.reply('serialport:list:result', {
            ports: ports
        });
    });
});
electron_1.ipcMain.on('serialport:command:turnOnAll', function (event) {
    console.log('Turn on all');
    var command = "at+txc=1,1000,FF00000001\r\n";
    if (!!port) {
        port.write(command);
        setTimeout(function () {
            console.log('Returning on all');
            mainWindow.webContents.send('serialport:command:result', null);
        }, intervalCommands);
    }
});
electron_1.ipcMain.on('serialport:command:turnOffAll', function (event) {
    var command = "at+txc=1,1000,FF00000000\r\n";
    if (!!port) {
        port.write(command);
        setTimeout(function () {
            console.log('Returning off all');
            mainWindow.webContents.send('serialport:command:result', null);
        }, intervalCommands);
    }
});
electron_1.ipcMain.on('serialport:command:sendNoReturn', function (event, args) {
    console.log('no return');
    var room = args[0].room;
    var active = room.value ? 1 : 0;
    var command = "at+txc=1,1000," + room.node + "0000000" + active + "\r\n";
    if (!!port) {
        port.write(command);
        console.log('drain');
    }
});
electron_1.ipcMain.on('serialport:command:send', function (event, args) {
    console.log(args);
    var room = args[0].room;
    var active = room.value ? 1 : 0;
    var command = "at+txc=1,1000," + room.node + "0000000" + active + "\r\n";
    if (!!port) {
        port.write(command);
        setTimeout(function () {
            console.log('return', room.name);
            event.reply('serialport:command:result', room);
        }, intervalCommands);
    }
});
function openPort(comName, event) {
    retryConnection++;
    port = new SerialPort(comName, {
        baudRate: 115200,
        lock: false
    })
        .on('open', function () {
        console.log("[" + comName + "]: opened");
        port.set({
            dtr: true,
            dsr: true
        });
        event.reply('serialport:port:open', comName);
    })
        .on('data', function (data) {
        // console.log(`[${comName}]: data: ${Buffer.from(data).toString()}, ${Date.now()}`);
        var message = Buffer.from(data).toString();
        if (message.includes('Welcome to RAK811')) {
            mainWindow.webContents.send('serialport:port:welcome');
            port.drain();
        }
    })
        .on('error', function (err) {
        console.log('err', err);
        if (port.isOpen) {
            port.close();
        }
        if (err.message.includes('Error Resource temporarily unavailable') && retryConnection < 3) {
            return openPort(comName, event);
        }
        if (err.message.includes('No such file or directory')) {
            return mainWindow.webContents.send('serialport:port:closed');
        }
        process.exit();
    });
}
