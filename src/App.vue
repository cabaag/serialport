<template>
	<v-app>
		<v-app-bar app>
			<v-toolbar-title class="headline text-uppercase">
				<img src="./assets/logo.png" height="50px" />
			</v-toolbar-title>
		</v-app-bar>

		<v-content>
			<Home />
		</v-content>
	</v-app>
</template>

<script>
import Vue from 'vue';
import Home from './components/Home';

Vue.config.devtools = true;

export default {
	name: 'App',
	components: {
		Home
	},
	data: () => ({
		//
	})
};
</script>
