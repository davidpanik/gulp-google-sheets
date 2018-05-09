# gulp-google-sheets

This is a Gulp plugin for pulling down content from Google Sheets for use in your workflow.

It provides a Gulp interface to: [node-google-spreadsheet](https://github.com/theoephraim/node-google-spreadsheet)
And is inspired by: [gulp-google-spreadsheets](https://raw.githubusercontent.com/uts-magic-lab/gulp-google-spreadsheets)

## Installation

    npm install gulp-google-spreadsheets --save-dev

## Basic usage

	let googleSheets = require('gulp-google-sheets');

	googleSheets(id, [output,] [credentials])
	.pipe(gulp.dest('./data/'));

**id** is the long identifier from the URL of the spreadsheet.

**output** specifies the desired output format (see section below)

**credentials** is a JSON object required for accessing a private spreadsheets

The plugin return a JSON object as a Vinyl stream that can be piped to another plugin or directly to an output file.

## Publishing

Note that access a spreadsheet from the plugin (or programmatically at all) you must first publish it. This can be done in Google Sheets by selecting "Publish to the web..." from the "File" menu.

## Accessing a private spreadsheet

In addition to the above, if a spreadsheet hasn't been publically accessible you will need to grant access to a Service Account and then specify the access credentials for that account as the third parameter to the plugin. [node-google-spreadsheet](https://github.com/theoephraim/node-google-spreadsheet) gives more detailed instructions on how to achieve this.

## Output modes

The plugin supports three different formats of output it can produce:

**cells** (default) - Returns an object of all populated cells included with their spreadsheet identifier (e.g. A3) as a key.

**grid** - Returns a 2D array of all cells (regardless of whether they are populated or empty).

**rows** - Returns an array of row objects, each containing cells with their "title" as the key. The "title" is taken from the first row of the spreadsheet (this format is closest to what is returned by Google).

