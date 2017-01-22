'use strict';
const _ = require('lodash');
const fs = require('fs');
const csv = require('./lib/csv-parser.js');
const urls = require('./lib/url-generator.js');

const loadFileContent = (filepath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (err, content) => {
      if(err) {
        reject(err)
      } else {
        try {
          resolve(content);
        } catch(err) {
          reject(err)
        }
      }
    })
  });
}

// on development
loadFileContent(`${__dirname}/resources/SP500.csv`)
.then(csv.jsonCSV)
.then(metadata => {
  let stock = _.first(metadata);
  return urls.createWikiUrl(stock);
})
.then(console.log)
.catch(console.log);
