xmldom = require('xmldom');
var fs = require('fs');


// Node Types
var NodeType = {}
var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
var TEXT_NODE = NodeType.TEXT_NODE = 3;
var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
var NOTATION_NODE = NodeType.NOTATION_NODE = 12;

/*
returns array of i18nUsage:
var i18nUsage = {
    file: file,
    value: attr.value.substring(6, attr.value.length - 1)
}
*/
exports.readI18nUsageFromXML = function(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, "utf-8", function(err, data) {
            var doc = new xmldom.DOMParser().parseFromString(data);
            var docEl = doc.documentElement;
            var arr = [];
            getI18nUsageInXMLRecursive(arr, file, docEl);
            return resolve(arr)
        });
    });
}
exports.readI18nUsageFromXMLCallback = function(file, callback) {
    fs.readFile(file, "utf-8", function(err, data) {
        var doc = new xmldom.DOMParser().parseFromString(data);
        var docEl = doc.documentElement;
        var arr = [];
        getI18nUsageInXMLRecursive(arr, file, docEl);
        callback(arr);
    });
}


//var i18nUsage = {file:"",value:""}
function getI18nUsageInXMLRecursive(arr, file, el) {
    if (el.nodeType != ELEMENT_NODE) {
        return;
    }
    //console.log(el.tagName);
    for (var i = 0; i < el.attributes.length; i++) {
        var attr = el.attributes[i];
        if (attr.value.startsWith("{i18n>")) {
            var i18nUsage = {
                file: file,
                value: attr.value.substring(6, attr.value.length - 1)
            }
            arr.push(i18nUsage);
            //console.log(el.tagName);
            //console.log(i18nUsage);
        }
    }
    //search children
    for (var i = 0; i < el.childNodes.length; i++) {
        var childEl = el.childNodes[i]
        getI18nUsageInXMLRecursive(arr, file, childEl)
    }

}

//returns true false
function searchElementAttributesRecursive(el, foundFunc) {
    if (el.nodeType != ELEMENT_NODE) {
        return false;
    }

    for (var i = 0; i < el.attributes.length; i++) {
        var attr = el.attributes[i]
        if (foundFunc(attr.value)) {
            console.log(el.tagName);
            return true;
        }
    }
    //search children
    for (var i = 0; i < el.childNodes.length; i++) {
        var childEl = el.childNodes[i]
        if (searchElementAttributesRecursive(childEl, foundFunc)) {
            return true;
        }
    }

}
