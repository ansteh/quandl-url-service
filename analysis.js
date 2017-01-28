'use strict';
const _ = require('lodash');
const fs = require('fs');
const urls = require('./lib/url-generator.js');
const util = require('./lib/util.js');

const Stocks = (metas) => {
  const cache = new Map();

  const getStock = (ticker) => {
    return new Promise((resolve, reject) => {
      if(cache.has(ticker)) {
        resolve(cache.get(ticker));
      } else {
        util.loadFileContent(`${__dirname}/resources/cached/${ticker}.json`)
          .then((data) => {
            cache.set(ticker, data);
            resolve(data);
          })
          .catch(reject);
      }
    });
  };

  return {
    getStock: getStock
  };
};

module.exports = Stocks;
