'use strict';
const _ = require('lodash');
const fs = require('fs');
const csv = require('./lib/csv-parser.js');
const urls = require('./lib/url-generator.js');
const http = require('./lib/request.js');
const util = require('./lib/util.js');
const casher = require('./lib/casher.js');
const Promise = require('bluebird');
const async = require('async');

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

const testStockGetData = () => {
  return getSP500()
  .then(stockMarket)
  .then((stocks) => {
    let stock =  stocks.getStock({ ticker: 'AAPL' });
    return stock;
  })
  .then((stock) => {
    return stock.getData(['Date', 'Close', 'Ex-Dividend']);
  })
  .then(console.log)
  .catch(console.log);
}

const createStockCubeFile = () => {
  let market;
  return getSP500()
  .then(stockMarket)
  .then(instance => market = instance)
  .then(() => market.getStocksByMetas())
  .then(stocks => market.getUniqueDates(stocks))
  .then(dates => casher.createStockCubeFile(`${__dirname}/resources/aggregation/SP500/index.json`, dates))
  .then(console.log)
  .catch(console.log);
}

// createStockCubeFile();

const loadStockCube = () => {
  return util.loadFileContent(`${__dirname}/resources/aggregation/SP500/index.json`)
  .then(JSON.parse);
}

const loadSP500Market = () => {
  return getSP500()
  .then(stockMarket);
}

const getUncrawledStockMetas = (cube, market) => {
  let crawledTickers = _.map(cube.tickers, 'ticker');
  let metas = market.getMetas();
  // metas = _.take(metas, 10);
  return _.filter(metas, (meta) => {
    return _.includes(crawledTickers, meta.ticker) === false;
  });
}

const crawlSP500Index = ({ column, filename }) => {
  let allDates, market;

  return Promise.all([loadStockCube(), loadSP500Market()])
  .then(([cube, marketInstance]) => {
    market = marketInstance;
    let metas = getUncrawledStockMetas(cube, market);
    // metas = _.take(metas, 10);
    return Promise.all(_.map(metas, meta => market.getStock(meta)));
  })
  .then((stocks) => {
    allDates = market.getUniqueDates(stocks);
    console.log('allDates.length', allDates.length);
    return stocks;
  })
  // .then((stocks) => {
  //   return Promise.all(_.map(targets, target => saveAggregationFile(_.assign(target, { stocks, dates: allDates }))));
  // })
  .then((stocks) => {
    let dataset = _.map(stocks, stock => {
      let values = stock.getValuesOfColumnByDates(column, allDates);
      console.log(stock.meta.ticker);
      return values;
    });
    return Promise.all(dataset);
  })
  .then((dataset) => {
    return { dates: allDates, dataset };
  })
  .then((json) => {
    let content = JSON.stringify(json);
    return util.writeFileContent(`${__dirname}/resources/aggregation/SP500/${filename}.json`, content);
  })
  .then(console.log)
  .catch(console.log);
}

const saveAggregationFile = ({ stocks, dates, column, filename }) => {
  let dataset = _.map(stocks, stock => {
    let values = stock.getValuesOfColumnByDates(column, dates);
    console.log(stock.meta.ticker);
    return values;
  });

  return Promise.all(dataset).then((dataset) => {
    return { dates, dataset };
  })
  .then((json) => {
    let content = JSON.stringify(json);
    return util.writeFileContent(`${__dirname}/resources/aggregation/SP500/${filename}.json`, content);
  })
}

let targets = {
  // date: { column: 'Date', index: 0, filename: 'date' },
  open: { column: 'Open', index: 1, filename: 'open' },
  high: { column: 'High', index: 2, filename: 'high' },
  low: { column: 'Low', index: 3, filename: 'low' },
  close: { column: 'Close', index: 4, filename: 'close' },
  volume:  { column: 'Volume', index: 5, filename: 'volume' }
};

crawlSP500Index(targets.volume);

// loadSP500Market()
// .then(stocks => stocks.getStock({ ticker: 'FB' }))
// .then(console.log)
// .catch(console.log);

const testSP500AggregationFile = (filename) => {
  return util.loadFileContent(`${__dirname}/resources/aggregation/SP500/${filename}.json`)
  .then(JSON.parse)
  .then(({ dates, dataset }) => {
    return _.map(dates, (date, index) => {
      return _.chain(dataset)
        .map(index)
        .sum()
        .value();
    });
  });
}

testSP500AggregationFile('close')
.then(index => _.slice(index, -10))
.then(console.log)
.catch(console.log);

// Promise.all(_.map(_.keys(targets), testSP500AggregationFile))
// .then(indices => _.map(indices, index => _.slice(index, -10)))
// .then(console.log)
// .catch(console.log);
