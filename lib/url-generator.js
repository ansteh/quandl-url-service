'use strict';
const _ = require('lodash');

const createWikiUrl = (stock) => {
  let ticker = _.replace(stock.ticker, '-', '_');
  return `https://www.quandl.com/api/v3/datasets/${ getDirectory(stock) }/${ _.toUpper(ticker) }.json`;
};

const getDirectory = (stock) => {
  var directory = _.first(stock.free_code.split('/'));
  return _.toUpper(directory);
}

module.exports = {
  createWikiUrl: createWikiUrl
}
