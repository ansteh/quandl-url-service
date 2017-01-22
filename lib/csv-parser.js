'use strict';
const _ = require('lodash');

const parseCSV = (str, delimiter) => {
  delimiter = delimiter || ",";
  const pattern = new RegExp("(\\"+delimiter+"|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\"\\"+delimiter+"\\r\\n]*))","gi");
  const data = [[]];
  let matches = null, match;

  while (matches = pattern.exec(str)){
    let matchedDelimiter = matches[1];
    if (matchedDelimiter.length && (matchedDelimiter !== delimiter)) {
      data.push([]);
    }
    if (matches[2]){
      match = matches[2].replace(new RegExp("\"\"", "g"), "\"");
    } else {
      match = matches[3];
    }
    data[data.length-1].push(match);
  }
  return data;
}

const jsonArray = (keys, collection) => {
  return _.map(collection, function(item) {
    var json = {};
    _.forEach(keys, function(key, index) {
      json[key] = item[index];
    });
    return json;
  });
}

const jsonCSV = (csvStr) => {
  let collection = parseCSV(csvStr);
  let columns = collection.shift();
  return jsonArray(columns, collection);
}

module.exports = {
  parse: parseCSV,
  jsonCSV: jsonCSV
}
