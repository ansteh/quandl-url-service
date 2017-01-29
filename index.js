'use strict';
const _ = require('lodash');
const fs = require('fs');
const csv = require('./lib/csv-parser.js');
const urls = require('./lib/url-generator.js');
const http = require('./lib/request.js');
const util = require('./lib/util.js');

const getSP500 = () => {
  return util.loadFileContent(`${__dirname}/resources/SP500.csv`)
  .then(csv.jsonCSV)
  .then(metas => _.filter(metas, meta => _.has(meta, 'ticker') && meta.ticker !== ''));
};

const requestStock = (metadata) => {
  let url = urls.createWikiUrl(metadata);
  return http.request(url);
};

const cacheStock = (data, metadata) => {
  return util.writeFileContent(`${__dirname}/resources/cached/${metadata.ticker}.json`, data);
}

const timeoutRequestStock = (metas, delay) => {
  setTimeout(() => {
    let metadata = metas.shift();
    // console.log('metadata', metadata);
    // console.log('metas.length', metas.length);
    requestStock(metadata)
      .then(data => cacheStock(data, metadata))
      .then(() => {
        console.log('saved');
        if(metas.length > 0) {
          timeoutRequestStock(metas, delay);
        } else {
          console.log('all parsed!');
        }
      })
      .catch((err) => {
        console.log(err, metadata);
      });
  }, delay);
};

const getAllFreeCodeStocksOfSP500 = (delay, startTicker) => {
  return getSP500()
    .then(metas => _.filter(metas, meta => _.has(meta, 'free_code')))
    .then((metas) => {
      if(startTicker) {
        let index = _.findIndex(metas, { ticker: startTicker });
        return _.slice(metas, index);
      }
      return metas;
    });
};

const cacheAllFreecodeStocksOfSP500 = (delay, startTicker) => {
  return getAllFreeCodeStocksOfSP500(delay, startTicker)
    // .then(metas => _.filter(metas, meta => _.includes(meta.ticker, '-')))
    .then((metas) => {
      console.log(metas.length);
      timeoutRequestStock(metas, delay);
    })
    .catch(console.log);
};

// cacheAllFreecodeStocksOfSP500(200);

// console.log(require('./resources/cached/CAT.json'));

const stockMarket = require('./analysis.js');
getSP500()
  .then(stockMarket)
  .then((stocks) => {
    let stock =  stocks.getStock('AAPL');
    return stock;
  })
  .then((stock) => {
    return stock.getData(['Date', 'Close', 'Ex-Dividend']);
  })
  // .then(console.log)
  .catch(console.log)
