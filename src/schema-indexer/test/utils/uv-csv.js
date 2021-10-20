////////////////////////////////////////
function CSV(path, header, bufSize, appendOnly){
	const fs = require('fs');

  // clear file with header
  if(appendOnly){
    if(!fs.existsSync(path)){
      fs.writeFileSync(path, `${header}\n`);
    }
    else{
      var stats = fs.statSync(path)
      var fileSizeInBytes = stats.size;
      if(fileSizeInBytes == 0){
        fs.writeFileSync(path, `${header}\n`);
      }
    }
  }else{
    fs.writeFileSync(path, `${header}\n`);
  }


  let count =0;
  let rows = [];
  ////////////////////////////////////////
  function flush(){
    //console.log('flush');
    buf="";
    for(r of rows){
      //buf += r.join()+'\n';
      buf += r +'\n';
      count++;
    }
    fs.appendFileSync(path, buf);
    rows = [];
  }
  ////////////////////////////////////////
  function addRow(row){
    rows.push(row);
    if(rows.length >= bufSize){
      flush();
    }
  }
  ////////////////////////////////////////
  return{
    flush:flush,
    addRow:addRow,
    count:count
  }
}

module.exports = CSV;