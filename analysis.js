'use strict';
const _ = require('lodash');
const fs = require('fs');
const urls = require('./lib/url-generator.js');
const util = require('./lib/util.js');
const Promise = require('bluebird');

const Stock = (stock) => {
  let dataset = stock.dataset;
  let data = _.reverse(dataset.data);

  const getIndicesOfNeedles = getNeedlesIndicesOfColumns(dataset.column_names);
  // console.log(_.keys(dataset));
  // console.log(dataset.column_names);
  // console.log(_.first(data));

  const getData = (columns) => {
    let indices = getIndicesOfNeedles(columns);
    return _.map(data, (set) => {
      return _.map(indices, index => set[index]);
    });
  };

  return {
    getData
  };
};

const getNeedlesIndicesOfColumns = _.curry((columns, needles) => {
  return _.map(needles, needle => _.findIndex(columns, column => column === needle));
});

const Stocks = (metas) => {
  const cache = new Map();

  const getStock = (ticker) => {
    return new Promise((resolve, reject) => {
      if(cache.has(ticker)) {
        resolve(cache.get(ticker));
      } else {
        util.loadFileContent(`${__dirname}/resources/cached/${ticker}.json`)
          .then((jsonStr) => {
            let stock = Stock(JSON.parse(jsonStr));
            cache.set(ticker, stock);
            resolve(stock);
          })
          .catch(reject);
      }
    });
  };

  // Promise.all(_.map(metas, meta => getStock(meta.ticker)))
  // .then(function() {
  //   console.log("all the files were created", cache.size);
  // });

  return {
    getStock: getStock
  };
};

module.exports = Stocks;
