'use strict';
const _ = require('lodash');
const fs = require('fs');
const urls = require('./lib/url-generator.js');
const util = require('./lib/util.js');
const Promise = require('bluebird');
const moment = require('moment');

const dateFormat = 'YYYY-MM-DD';

const Stock = (meta, stock) => {
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
    // console.log(dataset.start_date);
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

  const getStock = (meta) => {
    let ticker = meta.ticker;
    return new Promise((resolve, reject) => {
      if(_.has(cache, ticker)) {
        resolve(_.get(cache, ticker));
      } else {
        util.loadFileContent(`${__dirname}/resources/cached/${ticker}.json`)
          .then((jsonStr) => {
            let stock = Stock(meta, JSON.parse(jsonStr));
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

  const getStocksSortedByStartDateDesc = (stocks) => {
    return _.chain(stocks)
      .sortBy(stock => moment(stock.getStartDate(), dateFormat))
      value();
  };

  getStock({ ticker: 'MMM' })
  .then(console.log)
  .catch(console.log);

  const test = () => {
    let data = _.take(metas, 10);
    data = metas;
    Promise.all(_.map(data, meta => getStock(meta)))
    .then(function() {
      console.log("all the files were created");
      let stocks = _.values(cache);
      let startDates = getStarDates(stocks);
      let endDates = getEndDates(stocks);
      console.log('slice start:', _.max(startDates));
      console.log('slice end:', _.min(endDates));

      // let dates = _.chain(startDates)
      //   .sortBy(x => x)
      //   .value();
      // console.log(dates);

      console.log(getStocksSortedByStartDateDesc(data));
    });
  };

  return {
    getStock
  };
};

module.exports = Stocks;
