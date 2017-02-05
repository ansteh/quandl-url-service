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
    return _.get(dataset, 'start_date');
  };

  const getEndDate = () => {
    return _.get(dataset, 'end_date');
  };

  const getDates = () => {
    return dates;
  };

  const getRowByDate = (date) => {
    let index = _.findIndex(dates, x => x === date);
    if(index > -1) return data[index];
  };

  const getCloseByDate = (date) => {
    return _.get(getRowByDate(date), '4');
  };

  const durationInDays = () => {
    let start = moment(getStartDate());
    let end = moment(getEndDate());
    return moment.duration(end.diff(start)).asDays();
  }

  const findIndexOfDate = (date) => {
    return _.findIndex(dates, x => x === date);
  }

  const fitCloseDataBy = (datesToFit) => {
    return _.map(datesToFit, (date) => {
      let index = findIndexOfDate(date);
      return _.get(data, `${index}.4`, 0);
    });
  }

  return {
    getData,
    getDates,
    getStartDate,
    getEndDate,
    getCloseByDate,
    durationInDays,
    fitCloseDataBy
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

  const getStocks = (stocks) => {
    return Promise.all(_.map(stocks, getStock));
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

  const getStocksByMetas = (limit = metas.length) => {
    return getStocks(_.take(metas, limit));
  }

  const calculateIndex = (stocks) => {
    let dates = getUniqueDates(stocks);
    return _.map(dates, (date) => {
      return _.chain(stocks)
        .map(stock => stock.getCloseByDate(date))
        .filter(_.isNumber)
        .sum()
        .value();
    });
  };

  const getUniqueDates = (stocks) => {
    return _.chain(stocks)
      .map(stock => stock.getDates())
      .flatten()
      .uniq()
      .sortBy(date => moment(date, dateFormat))
      .value();
  };

  const countDates = (stocks) => {
    return _.chain(stocks)
      .map(stock => stock.getDates())
      .flatten()
      .groupBy()
      .map(group => group.length)
      .value();
  };

  const getDurationsInDays = (stocks, delimiter) => {
    return _.chain(stocks)
      .map((stock) =>  {
        return {
          stock,
          duration: stock.durationInDays(delimiter)
        };
      })
      .sortBy('duration')
      .value();
  };

  const getStockTest = () => {
    return getStock({ ticker: 'MMM' })
      .then(console.log)
      .catch(console.log);
  }

  const median = (series) => {
    if(series.length % 2) {
      return series[(series.length+1)/2 - 1];
    } else {
      if(series.length > 1) {
        let fix = (series.length)/2 - 1;
        return (series[fix] + series[fix+1])/2;
      }
      return _.first(series);
    }
  };

  const createCube = (stocks) => {
    let dates = getUniqueDates(stocks);
    return _.map(stocks, stock => stock.fitCloseDataBy(dates));
  }

  const test = () => {
    return getStocksByMetas()
    .then((data) => {
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

  const testGetUniqueDates = () => {
    return getStocksByMetas()
    .then(getUniqueDates)
    .then(console.log)
    .catch(console.log);
  };

  const testCountDates = () => {
    return getStocksByMetas(10)
    .then(countDates)
    .then(console.log)
    .catch(console.log);
  };

  const testCalculateIndex = () => {
    return getStocksByMetas(10)
    .then(calculateIndex)
    .then(index => _.slice(index, -10))
    .then(console.log)
    .catch(console.log);
  };

  const testGetDurationsInDays = () => {
    return getStocksByMetas(10)
    .then(getDurationsInDays)
    .then(infos => _.map(infos, 'duration'))
    .then(console.log)
    .catch(console.log);
  };

  // return getStocksByMetas(1)
  // .then((stocks) => {
  //   let dates = getUniqueDates(stocks);
  //   let stock = _.first(stocks);
  //   return _.uniq(stock.fitCloseDataBy(dates));
  // })
  // .then(console.log)
  // .catch(console.log);

  const testCreateCube = () => {
    return getStocksByMetas(10)
    .then(createCube)
    .then(matrix => _.uniq(_.flatten(matrix)))
    .then(console.log)
    .catch(console.log);
  };

  // testGetUniqueDates();
  // testCountDates();
  // testCalculateIndex();
  // testGetDurationsInDays();
  // testCreateCube();

  const testbed = () => {
    let stocks;
    return getStocksByMetas()
    .then((instances) => { stocks = instances; return stocks; })
    .then(getDurationsInDays)
    .then(infos => _.map(infos, 'duration'))
    .then(median)
    .then(console.log)
    .catch(console.log);
  };

  // testbed();

  return {
    getStock,
    getStocksByMetas,
    getUniqueDates
  };
};

module.exports = Stocks;
