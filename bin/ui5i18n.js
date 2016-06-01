#!/usr/bin/env node

var xml = require('../lib/xml');
var prop = require('../lib/prop');
var fs = require('fs');


var walk = function(dir, fileDecideFunc) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        //console.log(file);
        if (file == "node_modules") {
            return;
        }

        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file, fileDecideFunc));
        } else {
            if (!fileDecideFunc(file)) {
                return;
            }
            results.push(file);
        }
    });
    return results
}

function eqSet(as, bs) {
    if (as.size !== bs.size) return false;
    for (var a of as)
        if (!bs.has(a)) return false;
    return true;
}
//takes i18nAll, return array of grouped i18n
//[ { key: 'buttonAcceptText',
//    usedIn: Set { './testdata/Allowance.view.xml' } },
function prepareSetArr(groupedI18n, arr) {

    if (arr.length == 0) {
        return groupedI18n;
    }
    //take one
    var splicedArr = arr.splice(arr.length - 1, 1);
    var splicedI18n = splicedArr[0];

    var setOfI18n = {
        i18nArr: [splicedI18n.key],
        usedInSet: splicedI18n.usedIn
    }

    for (var i = arr.length - 1; i > 0; i--) {

        if (eqSet(setOfI18n.usedInSet, arr[i].usedIn)) {

            setOfI18n.i18nArr.push(arr[i].key);
            arr.splice(i, 1);
        }

    }
    groupedI18n.push(setOfI18n);
    //if(arr.length>0){}
    prepareSetArr(groupedI18n, arr);
}

//cache all found i18n usages:
var xmlFiles = walk('.', function(file) {
    if (file.endsWith('.xml')) {
        return true;
    }
    return false;
});
//console.log(xmlFiles);
var xmlReadingArr = xmlFiles.map(xml.readI18nUsageFromXML);
Promise.all(xmlReadingArr).then(function(xmlReadingResultArr) {
    var i18nUsageXMLArr = Array.prototype.concat.apply([], xmlReadingResultArr);
    //console.log(i18nUsageXMLArr);
    var i18nAll = {};
    i18nUsageXMLArr.forEach(function(i18nUsage) {
        if (!i18nAll.hasOwnProperty(i18nUsage.value)) {
            i18nAll[i18nUsage.value] = {};
            i18nAll[i18nUsage.value]['key'] = i18nUsage.value;
            i18nAll[i18nUsage.value]['usedIn'] = new Set([i18nUsage.file]);
        } else {

            i18nAll[i18nUsage.value]['usedIn'].add(i18nUsage.file);
        }
    });
    //console.log(i18nAll);
    var propFiles = walk('.', function(file) {
        if (file.endsWith('.properties') && !file.endsWith('.help.properties')) {
            return true;
        }
        return false;
    });
    propFiles.forEach(function(propFile) {
        var properties;
        prop.readProperties(propFile, function(props) {
            properties = props;
            var notFoundProperties = [];
            var notUsedProperties = [];
            //Look for undefined properties
            Object.keys(i18nAll).forEach(function(i18nKey) {
                //var i18n = i18nAll[i18nKey];
                if (!properties.hasOwnProperty(i18nKey)) {
                    notFoundProperties.push(i18nAll[i18nKey]);
                }
            });

            var helpFileName = "";
            if (propFile.endsWith(".properties")) {
                helpFileName = propFile.substring(0, propFile.length - 11) + '.help.properties';
            } else {
                helpFileName = propFile + '.help.properties';
            }

            var helpFileStream = fs.createWriteStream(helpFileName, {
                'encoding': 'utf-8'
            });

            notFoundProperties.forEach(function(i18nUsage) {
                //console.log(i18nUsage);
                helpFileStream.write('#NOT FOUND: ' + i18nUsage.key + '\n');
                i18nUsage.usedIn.forEach(function(usedIn) {
                    helpFileStream.write('#used in: ' + usedIn + '\n');
                });
                helpFileStream.write('\n');
            });
            //i18nAllArr = _.values(i18nAll);
            var i18nAllArr = [];
            Object.keys(properties).forEach(function(key) {
                if (i18nAll.hasOwnProperty(key)) {
                    i18nAllArr.push(i18nAll[key]);
                } else {
                    notUsedProperties.push({
                        key: key,
                        value: properties[key]
                    });
                }
            });

            if (notUsedProperties.length > 0) {
                helpFileStream.write('#NOT USED: \n');

                notUsedProperties.forEach(function(prop) {
                    //console.log(i18nUsage);
                    helpFileStream.write(prop.key + '\t=\t' + prop.value + '\n');
                });
                helpFileStream.write('\n');
            }

            //console.log(i18nAllArr);
            i18nAllArr.sort(function(a, b) {
                return a.usedIn.size - b.usedIn.size;
            })
            var groupedI18nArr = [];
            prepareSetArr(groupedI18nArr, i18nAllArr);
            //console.log(groupuedI18n);
            groupedI18nArr.forEach(function(groupedI18n) {
                groupedI18n.i18nArr.forEach(function(key) {
                    helpFileStream.write(key + '\t=\t' + properties[key] + '\n');
                });
                groupedI18n.usedInSet.forEach(function(usedIn) {
                    helpFileStream.write('#used in: ' + usedIn + '\n');
                });
                helpFileStream.write('\n');

            });
            helpFileStream.end();
        });


    });

}).catch(function(err) {
    // js fails silently without catch;
    console.log('A promise failed to resolve', err);
    return xmlReadingArr;
});
