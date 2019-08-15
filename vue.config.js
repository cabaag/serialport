module.exports = {
	configureWebpack: {
		devtool: 'source-map'
	},
	pluginOptions: {
		electronBuilder: {
			// List native deps here if they don't work
			externals: ['serialport']
		}
	}
}