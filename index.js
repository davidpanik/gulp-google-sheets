let GoogleSpreadsheet = require('google-spreadsheet');
let EventStream = require('event-stream');
let Vinyl = require('vinyl');
let fs = require('fs');
let data = {};

// Combine row/col co-ordinates as spreadsheet like reference
// e.g. 1,1 == A1 | 4,3 === C4
function makeCellRef(row, col) {
	const LETTERS = 'ABCDEFGHIJKLMNOQPRSTUVWXYZ';

	return LETTERS.charAt(col - 1) + row;
}

// Convert text to a lowercase, dash-seperated string
function dashify(title) {
	return title.replace(/\W+/g, '-').toLowerCase();
}

// Initiate things with Google Sheets
function loadSpreadsheet(id, creds, callback) {
	let doc = new GoogleSpreadsheet(id);

	if (!callback) {
		callback = creds;
		creds = null;

		getData(doc, callback);

		return;
	}

	doc.useServiceAccountAuth(creds, function (err) {
		if (err) {
			callback(err);
			return;
		}

		getData(doc, callback);
	});
}

// Retrieve the data from Google Sheets
function getData(doc, callback) {
	doc.getInfo(function (err, info) {
		if (err) {
			callback(err);
			return;
		}

		let sheetsLoaded = 0;

		for (let item in info) {
			data[item] = info[item];
		}

		data = {
			'id': info['id'],
			'title': info['title'],
			'updated': info['updated'],
			'authorName': info['author']['name'],
			'authorEmail': info['author']['email'],
			'worksheets': []
		}

		for (let sheet in info.worksheets) {
			let newSheet = {
				'url': info.worksheets[sheet]['url'],
				'id': info.worksheets[sheet]['id'],
				'title': info.worksheets[sheet]['title'],
				'rowCount': info.worksheets[sheet]['rowCount'],
				'colCount': info.worksheets[sheet]['colCount'],
				'cells': {}
			}

			data.worksheets.push(newSheet);

			info.worksheets[sheet].getCells(function (err, cells) {
				if (err) {
					callback(err);
					return;
				}

				for (let cell in cells) {
					let currentCell = cells[cell];
					newSheet.cells[makeCellRef(currentCell.row, currentCell.col)] = currentCell.value;
				}

				if (++sheetsLoaded >= info.worksheets.length) {
					callback(null, data);
				}
			});
		}
	});
}

module.exports = loadSpreadsheet;
