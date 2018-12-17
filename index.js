let GoogleSpreadsheet = require('google-spreadsheet');
let EventStream = require('event-stream');
let Vinyl = require('vinyl');
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
function loadSpreadsheet(id, method, creds, callback) {
	let doc = new GoogleSpreadsheet(id);

	if (!callback || !creds) {
		callback = callback || creds;
		creds = null;

		getData(doc, method, callback);

		return;
	}

	doc.useServiceAccountAuth(creds, function (err) {
		if (err) {
			callback(err);
			return;
		}

		getData(doc, method, callback);
	});
}

// Retrieve the data from Google Sheets
function getData(doc, method, callback) {
	doc.getInfo(function (err, info) {
		if (err) {
			callback(err);
			return;
		}

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
		};

		let sheetsLoaded = 0;

		for (let currentSheet of info.worksheets) {
			let newSheet = {
				'url': currentSheet['url'],
				'id': currentSheet['id'],
				'title': currentSheet['title'],
				'rowCount': currentSheet['rowCount'],
				'colCount': currentSheet['colCount']
			};

			data.worksheets.push(newSheet);

			function sheetDone() {
				if (++sheetsLoaded >= info.worksheets.length) {
					callback(null, data);
				}
			}

			if (method === 'cells') {
				newSheet.cells = {};

				currentSheet.getCells(function (err, cells) {
					if (err) {
						callback(err);
						return;
					}

					for (let currentCell of cells) {
						newSheet.cells[makeCellRef(currentCell.row, currentCell.col)] = currentCell.value;
					}

					sheetDone();
				});
			}

			if (method === 'grid') {
				newSheet.grid = Array(currentSheet['rowCount']).fill(Array(currentSheet['colCount']).fill(''));

				currentSheet.getCells(function (err, cells) {
					if (err) {
						callback(err);
						return;
					}

					for (let currentCell of cells) {
						newSheet.grid[currentCell.row][currentCell.col] = currentCell.value;
					}

					sheetDone();
				});
			}

			if (method === 'rows') {
				newSheet.rows = [];

				currentSheet.getRows(function (err, rows) {
					if (err) {
						callback(err);
						return;
					}

					for (let currentRow of rows) {
						let newRow = {};

						for (let attr in currentRow) {
							if (attr.charAt(0) !== '_' && attr !== 'app:edited' && typeof (currentRow[attr]) === 'string') {
								newRow[attr] = currentRow[attr];
							}
						}

						newSheet.rows.push(newRow);
					}

					sheetDone();
				});
			}
		}
	});
}

// The part that interfaces with Gulp and wraps our data in a stream
function gulpInterface(id, method, creds) {
	let stream = new EventStream.Stream();

	loadSpreadsheet(id, method || 'cells', creds, function (err, data) {
		if (err) {
			console.log(err);
			return;
		}

		let file = new Vinyl({
			path: dashify(data.title) + '.json',
			contents: new Buffer(JSON.stringify(data, null, '    '))
		});

		stream.emit('data', file);
		stream.emit('end');
	});

	return stream.pipe(EventStream.through());
}

module.exports = gulpInterface;
