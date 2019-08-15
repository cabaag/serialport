<template>
  <div class="room">
		<v-btn class="ma-2" outlined large color="indigo" @click="switchRoom()"> {{room.name }} </v-btn>
	</div>
</template>

<script>
export default {
	props: {
		room: {
			type: Object,
			default: null
		}
	},
  data: () => ({
	}),
	methods: {
		switchRoom() {
			this.room.value = !this.room.value;
			this.room.emitter = 'local';
			this.ipc.send('serialport:command:send', {
				room
			});
			this.commandSend.emit(true);
		}
	}
};
</script>
