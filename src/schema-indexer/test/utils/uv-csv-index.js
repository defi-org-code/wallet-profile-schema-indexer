const fs = require('fs');

////////////////////////////////////////////////
class CSVIndex{
	////////////////////////////////////////////////
	constructor(){
	}
	////////////////////////////////////////////////
	load(path, indexColumn){
		this.index = {};

		var rows = fs.readFileSync(path, 'utf-8')
			.split('\n')
			.filter(Boolean);
		if(!rows){
			console.error('failed to load csv file rows');
			return;
		}
		if(rows.length < 2){
			console.error('failed to loadsplit rows');
		}
		console.log(`${path} file successfully loaded\trows-count: ${rows.length}`);
		// head
		for(var i=0 ; i < 5; ++i){
			console.log(rows[i]);
		}
		// index
		for( let row of rows){
			row = row.replace('\r','');
			let splt = row.split(',');
			let key = splt[indexColumn];
			this.index[key] = splt;
		}

		console.log(`${path} file successfully processed\trows-count: ${rows.length}`);
	}
	////////////////////////////////////////////////
	getRow(key){
		return this.index[key];
	}
}

module.exports = CSVIndex;