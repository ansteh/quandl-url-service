'use strict';
const _ = require('lodash');
const fs = require('fs');
const csv = require('./lib/csv-parser.js');
const urls = require('./lib/url-generator.js');
const http = require('./lib/request.js');

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

const writeFileContent = (filepath, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, data, 'utf8', (err) => {
      if(err) {
        reject(err)
      } else {
        try {
          resolve(true);
        } catch(err) {
          reject(err)
        }
      }
    })
  });
}

const getSP500 = () => {
  return loadFileContent(`${__dirname}/resources/SP500.csv`)
  .then(csv.jsonCSV);
};

const requestStock = (metadata) => {
  let url = urls.createWikiUrl(metadata);
  return http.request(url);
};

const cacheStock = (data) => {
  return writeFileContent(`${__dirname}/resources/cached/test.json`, data);
}

const timeoutRequestStock = (metas, delay) => {
  setTimeout(() => {
    console.log('stock', metas.shift());
    if(metas.length > 0) timeoutRequestStock(metas, delay);
  }, delay);
};

const getAllFreeCodeStocksOfSP500 = (delay) => {
  return getSP500()
    .then(metas => _.filter(metas, meta => _.has(meta, 'free_code')))
    .then((metas) => {
      timeoutRequestStock(metas, delay);
    });
};

getAllFreeCodeStocksOfSP500(200)
.catch(console.log)
