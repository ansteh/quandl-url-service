'use strict';
const _ = require('lodash');
const corepath = 'https://www.quandl.com/api/v3/datasets/';

const createWikiUrl = (stock) => {
  let ticker = prepareTicker(stock.ticker);
  return `${corepath}${ getDirectory(stock) }/${ _.toUpper(ticker) }.json`;
};

// https://www.quandl.com/api/v3/datasets/SEC/AMZN_SALESREVENUENET_A.json
const createUrlForAnnualySalesRevenueNet = (stock) => {
  let ticker = prepareTicker(stock.ticker);
  return `${corepath}SEC/${ _.toUpper(ticker) }_SALESREVENUENET_A.json`;
};

const createUrlForQuarterlySalesRevenueNet = (stock) => {
  let ticker = prepareTicker(stock.ticker);
  return `${corepath}SEC/${ _.toUpper(ticker) }_SALESREVENUENET_Q.json`;
};

const prepareTicker = (ticker) => {
  return _.replace(ticker, '-', '_');
}

const getDirectory = (stock) => {
  var directory = _.first(stock.free_code.split('/'));
  return _.toUpper(directory);
}

module.exports = {
  createWikiUrl: createWikiUrl
}
