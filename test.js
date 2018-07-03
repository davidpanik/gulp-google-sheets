let gsheets = require('./index.js');

gsheets('19jmxhlsoNrzyeGlAApGsHg2zVvo-3-XwLlusNVgmQWQ', function (err, data) {
	if (err) {
		console.log(err);
		return;
	}

	console.log(JSON.stringify(data, null, 4));
});