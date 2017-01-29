'use strict';
const _ = require('lodash');
const fs = require('fs');
const urls = require('./lib/url-generator.js');
const util = require('./lib/util.js');
const Promise = require('bluebird');
const moment = require('moment');

const dateFormat = 'YYYY-MM-DD';

const Stock = (stock) => {
  const dataset = stock.dataset;
  const data = _.reverse(dataset.data);
  const dates = _.map(data, set => set[0]);

  // console.log(_.keys(dataset));
  // console.log(dataset.column_names);
  // console.log(_.first(data));

  const getIndicesOfNeedles = getNeedlesIndicesOfColumns(dataset.column_names);

  const filter = (start, end) => {
    let startIndex = _.findIndex(dates, date => date === start);
    let endIndex = _.findIndex(dates, date => date === end);
    return _.slice(data, startIndex, endIndex);
  };

  const getData = (columns, start, end) => {
    let indices = getIndicesOfNeedles(columns);
    return _.map(data, (set) => {
      return _.map(indices, index => set[index]);
    });
  };

  const getStartDate = () => {
    console.log(dataset.start_date);
    return _.get(dataset, 'start_date');
  };

  const getEndDate = () => {
    return _.get(dataset, 'end_date');
  };

  return {
    getData,
    getStartDate,
    getEndDate
  };
};

const getNeedlesIndicesOfColumns = _.curry((columns, needles) => {
  return _.map(needles, needle => _.findIndex(columns, column => column === needle));
});

const Stocks = (metas) => {
  const cache = {};

  const getStock = (ticker) => {
    return new Promise((resolve, reject) => {
      if(_.has(cache, ticker)) {
        resolve(_.get(cache, ticker));
      } else {
        util.loadFileContent(`${__dirname}/resources/cached/${ticker}.json`)
          .then((jsonStr) => {
            let stock = Stock(JSON.parse(jsonStr));
            _.set(cache, ticker, stock);
            resolve(stock);
          })
          .catch(reject);
      }
    });
  };

  const getStarDates = (stocks) => {
    return _.map(stocks, stock => moment(stock.getStartDate(), dateFormat));
  };

  const getEndDates = (stocks) => {
    return _.map(stocks, stock => moment(stock.getEndDate(), dateFormat));
  };

  Promise.all(_.map(_.take(metas, 10), meta => getStock(meta.ticker)))
  .then(function() {
    console.log("all the files were created");
    let stocks = _.values(cache);
    let startDates = getStarDates(stocks);
    let endDates = getEndDates(stocks);
    console.log(_.max(startDates));
    console.log(_.min(endDates));
  });

  return {
    getStock
  };
};

module.exports = Stocks;
