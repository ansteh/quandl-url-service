'use strict';
const _ = require('lodash');

const createWikiUrl = (stock) => {
  return `https://www.quandl.com/api/v3/datasets/${ getDirectory(stock) }/${ _.toUpper(stock.ticker) }.json`;
};

const getDirectory = (stock) => {
  var directory = _.first(stock.free_code.split('/'));
  return _.toUpper(directory);
}

module.exports = {
  createWikiUrl: createWikiUrl
}
