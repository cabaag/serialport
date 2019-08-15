<template>
	<v-container>
		<v-layout wrap>
			<v-layout column>
				<v-flex v-if="!selectedPort">
					<v-toolbar class="elevation-0">
						<v-toolbar-title>Puertos</v-toolbar-title>
						<v-spacer></v-spacer>

						<v-toolbar-items>
							<v-btn text @click="scanPorts()">Escanear</v-btn>
						</v-toolbar-items>
					</v-toolbar>
				</v-flex>
				<v-layout row wrap align-content-start="">
					<v-flex v-for="(port, index) in ports" :key="index">
						<div>
							<v-btn class="ma-2" outlined large color="indigo" @click="connectPort(port)">
								{{ port.comName || port.path }}
							</v-btn>
						</div>
					</v-flex>
				</v-layout>
			</v-layout>
			<v-layout column v-if="selectedPort">
				<v-flex>
					<v-toolbar class="elevation-0">
						<v-toolbar-title>Salas</v-toolbar-title>
					</v-toolbar>
				</v-flex>
				<v-layout row wrap>
					<v-flex v-for="(room, index) in rooms" :key="index">
						<div>
							<v-btn
								class="ma-2"
								outlined
								large
								color="indigo"
								@click="switchRoom(room)"
								:disabled="waitingResponse"
							>
								{{ room.name }}
							</v-btn>
						</div>
					</v-flex>
				</v-layout>
			</v-layout>
			<v-snackbar v-model="snackbar" :timeout="3000">
				{{ snackbarText }}
				<v-btn color="pink" text @click="snackbar = false">
					Close
				</v-btn>
			</v-snackbar>
		</v-layout>
	</v-container>
</template>

<script>
import Vue from 'vue';
import VueFirestore from 'vue-firestore';
import Firebase from 'firebase';
import { ipcRenderer } from 'electron';

require('firebase/firestore');

Vue.use(VueFirestore);

var firebaseApp = Firebase.initializeApp({
	apiKey: 'AIzaSyCyMa_TmShKE9EH6HhMTgfBRi0odLmLC_k',
	authDomain: 'cnpachuca-ff3db.firebaseapp.com',
	databaseURL: 'https://cnpachuca-ff3db.firebaseio.com',
	projectId: 'cnpachuca-ff3db',
	storageBucket: 'cnpachuca-ff3db.appspot.com',
	messagingSenderId: '294309482727',
	appId: '1:294309482727:web:f07fc209ca6d0fff'
});

const firestore = firebaseApp.firestore();
const intervalCommands = 700;

export default {
	components: {},
	mounted() {
		this.selectedPort = localStorage.getItem('port');
		ipcRenderer.on('serialport:list:result', (event, args) => {
			console.log('Result');
			const ports = args.ports;
			this.ports = ports;
		});

		ipcRenderer.on('serialport:port:open', (event, comName) => {
			this.selectedPort = comName;
			this.snackbarText = 'Puerto conectado';
			this.snackbar = true;
		});

		ipcRenderer.on('serialport:port:closed', () => {
			this.selectedPort = null;
			this.loraMode = false;
			this.storage.clear('port');
			this.snackbarText = 'Puerto desconectado';
			this.snackbar = true;
		});

		ipcRenderer.on('serialport:command:result', (event, args) => {
			const room = args;
			console.log('Receiving', room);
			if (room) {
				this.firestore.rooms.doc(room['.key']).update({
					value: room.value
				});
			}
			this.waitingResponse = false;
		});

		ipcRenderer.on('serialport:port:welcome', () => {
			this.loraMode = true;
			setTimeout(() => {
				this.turnOnAll();
			}, intervalCommands);
		});
		ipcRenderer.send('serialport:list:action');
	},
	data: () => ({
		waitingResponse: false,
		selectedPort: '',
		loraMode: false,
		snackbarText: '',
		ports: null,
		snackbar: ''
	}),
	firestore() {
		return {
			rooms: firestore.collection('rooms')
		};
	},
	methods: {
		switchRoom(room) {
			console.log(room);
			room.value = !room.value;
			room.emitter = 'local';
			ipcRenderer.send('serialport:command:send', {
				room
			});
			this.commandSend();
		},
		commandSend() {
			this.waitingResponse = true;
		},
		scanPorts() {
			ipcRenderer.send('serialport:list:action');
			this.snackbarText = 'Escaneando puertos';
			this.snackbar = true;
		},

		closePort() {
			ipcRenderer.send('serialport:port:close');
		},

		turnOffAll() {
			console.log('Turn off all');
			this.rooms = this.rooms.map(room => {
				room.value = false;
				return room;
			});
			ipcRenderer.send('serialport:command:turnOffAll');
			this.commandSend();
			this.rooms = this.rooms.map((room, index, array) => {
				room.value = false;
				array[index].value = false;
				this.firestore.rooms.doc(room['.key']).update({
					value: false,
					emitter: 'local'
				});
				return room;
			});
		},

		turnOnAll() {
			console.log('Turn on all');
			this.rooms = this.rooms.map(room => {
				room.value = true;
				return room;
			});
			ipcRenderer.send('serialport:command:turnOnAll');
			this.commandSend();
			this.rooms = this.rooms.map((room, index, array) => {
				room.value = true;
				array[index].value = true;
				this.firestore.rooms.doc(room['.key']).update({
					value: true,
					emitter: 'local'
				});
				return room;
			});
		},

		connectPort(port) {
			ipcRenderer.send('serialport:port:connect', port.comName);
			localStorage.setItem('port', port.comName);
		}
	}
};
</script>
