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

const crawlSP500Index = () => {
  let allDates, market;
  return Promise.all([loadStockCube(), loadSP500Market()])
  .then(([cube, marketInstance]) => {
    market = marketInstance;
    let metas = getUncrawledStockMetas(cube, market);
    metas = _.take(metas, 10);
    return Promise.all(_.map(metas, meta => market.getStock(meta)));
  })
  .then((stocks) => {
    allDates = market.getUniqueDates(stocks);
    console.log('allDates.length', allDates.length);
    return stocks;
  })
  .then((stocks) => {
    return new Promise((resolve, reject) => {
      async.parallel(_.map(stocks, (stock) => {
        return (callback) => {
          let values = stock.fitCloseDataBy(allDates);
          console.log(stock.meta.ticker);
          callback(null, values);
        };
      }), (err, dataset) => {
        // console.log(dataset.length);
        if(err) {
          reject(err)
        } else {
          resolve(dataset);
        }
      });
    });

    // let dataset = _.map(stocks, stock => {
    //   let values = stock.fitCloseDataBy(allDates);
    //   console.log(stock.meta.ticker);
    //   return values;
    // });
    // return Promise.all(dataset);
  })
  .then((dataset) => {
    // return _.sum(_.map(dataset, _.sum));
    let range = _.range(dataset.length);
    return _.map(allDates, (date, index) => {
      return _.sum(_.map(range, slot => dataset[slot][index]));
    });
  })
  .then(index => _.slice(index, -10))
  .then(console.log)
  .catch(console.log);
}

crawlSP500Index();

// getSP500()
// .then(stockMarket)
// .then(console.log)
// .catch(console.log);

const perfTestbed = () => {
  let data = _.times(3000000, () => {
    return {
      name: 'it',
      salary: _.random(100)
    }
  });

  let start = new Date();

  // let sum = data.filter((item) => {
  // 	return item.name == "it"
  // })
  // .map((curr) => {
  // 	return curr.salary;
  // })
  // .reduce(function(prev, curr){
  // 	return prev + curr;
  // });

  let sum = data.reduce((sum, item) => {
    return item.name === 'it' ? sum+item.salary : sum;
  }, 0);

  let end = new Date();
  console.log("Native: Finished iterating, took: "+ (end-start) +" Sum "+sum);

  sum = 0;
  start = new Date();
  end = new Date();

  async.each(data, function(item, cb) {
  	if (item.name == "it")
  		sum += item.salary;
  	cb();
  }, function(err) {
      end =+ new Date();
      var diff = end - start; // time difference in milliseconds
      console.log("async: Finished iterating, took: "+diff + " Sum "+sum);
  });

  sum = 0;
  start = new Date();
  end = new Date();

  sum = _.reduce(data, (sum, item) => {
    return item.name === 'it' ? sum+item.salary : sum;
  }, 0);

  end = new Date();
  console.log("lodash: Finished iterating, took: "+ (end-start) +" Sum "+sum);
}

// perfTestbed();
