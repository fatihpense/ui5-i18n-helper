var fs = require('fs');
var readline = require('readline');

exports.readProperties = function(file, callback) {
    var properties = {};
    var lineReader = readline.createInterface({
        input: fs.createReadStream(file, {
            encoding: 'utf-8'
        })
    });

    lineReader.on('line', function(line) {
        if (line.startsWith("#")) {
            return;
        }
        //fastest code is no code
        //if(line.indexOf('=')==-1){return;}
        var arr = line.split('=');
        if (arr.length != 2) {
            return;
        }
        var key = arr[0].trim();
        var val = arr[1].trim();
        properties[key] = val;
        //console.log( key, '----', val);
    });
    lineReader.on('close', function(line) {
        callback(properties);

    });
}
