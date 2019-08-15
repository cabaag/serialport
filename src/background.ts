import { app, BrowserWindow, ipcMain, ipcRenderer, protocol } from 'electron';
import * as SerialPort from 'serialport';
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib';

let port: SerialPort;

let mainWindow: BrowserWindow;
let retryConnection = 0;
const intervalCommands = 700;
const isDevelopment = process.env.NODE_ENV !== 'production';
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true } }]);
console.log('Init');

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 600,
		webPreferences: { nodeIntegration: true, webSecurity: false }
	});

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		// Load the url of the dev server if in development mode
		mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
		if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
	} else {
		createProtocol('app');
		// Load the index.html when not in development
		mainWindow.setMenuBarVisibility(false);
		mainWindow.loadURL('app://./index.html');
	}

	mainWindow.on('closed', () => {
		mainWindow = null;
		if (port) {
			port.close();
		}
	});
}

app.on('ready', async () => {
	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		try {
			await installVueDevtools();
		} catch (e) {
			console.error('Vue Devtools failed to install:', e.toString());
		}
	}
	createWindow();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow();
	}
});

ipcMain.on('serialport:port:connect', (event, args) => {
	const comName = args[0];
	retryConnection = 0;
	openPort(comName, event);
});

ipcMain.on('serialport:port:close', (event, args) => {
	port.close(err => {
		event.reply('serialport:port:closed');
	});
});

ipcMain.on('serialport:list:action', event => {
	console.log('list')
	SerialPort.list().then(ports => {
		event.reply('serialport:list:result', {
			ports
		});
	});
});

ipcMain.on('serialport:command:turnOnAll', event => {
	console.log('Turn on all');
	const command = `at+txc=1,1000,FF00000001\r\n`;
	if (!!port) {
		port.write(command);
		setTimeout(() => {
			console.log('Returning on all');
			mainWindow.webContents.send('serialport:command:result', null);
		}, intervalCommands);
	}
});

ipcMain.on('serialport:command:turnOffAll', event => {
	const command = `at+txc=1,1000,FF00000000\r\n`;
	if (!!port) {
		port.write(command);
		setTimeout(() => {
			console.log('Returning off all');
			mainWindow.webContents.send('serialport:command:result', null);
		}, intervalCommands);
	}
});

ipcMain.on('serialport:command:sendNoReturn', (event, args: [{ room: any }]) => {
	console.log('no return');
	const room = args[0].room;
	const active = room.value ? 1 : 0;

	const command = `at+txc=1,1000,${room.node}0000000${active}\r\n`;

	if (!!port) {
		port.write(command);
		console.log('drain');
	}
});

ipcMain.on('serialport:command:send', (event, args: [{ room: any }]) => {
	console.log(args);
	const room = args[0].room;
	const active = room.value ? 1 : 0;

	const command = `at+txc=1,1000,${room.node}0000000${active}\r\n`;
	if (!!port) {
		port.write(command);
		setTimeout(() => {
			console.log('return', room.name);
			event.reply('serialport:command:result', room);
		}, intervalCommands);
	}
});

function openPort(comName: string, event) {
	retryConnection++;
	port = new SerialPort(comName, {
		baudRate: 115200,
		lock: false
	})
		.on('open', () => {
			console.log(`[${comName}]: opened`);
			port.set({
				dtr: true,
				dsr: true
			});
			event.reply('serialport:port:open', comName);
		})
		.on('data', data => {
			// console.log(`[${comName}]: data: ${Buffer.from(data).toString()}, ${Date.now()}`);
			const message = Buffer.from(data).toString();
			if (message.includes('Welcome to RAK811')) {
				mainWindow.webContents.send('serialport:port:welcome');
				port.drain();
			}
		})
		.on('error', (err: Error) => {
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
