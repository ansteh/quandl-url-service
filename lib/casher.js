'use strict';
const util = require('./util.js');

const createStockCubeFile = (url, dates) => {
  const body = {
    dates,
    tickers: [],
    data: []
  };

  return util.writeFileContent(url, JSON.stringify(body));
}

const writeDataToStockCubeFile = (url, ticker, data) => {

}

module.exports = {
  createStockCubeFile,
  writeDataToStockCubeFile
}
