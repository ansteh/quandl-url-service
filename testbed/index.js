'use strict';
const util = require('../lib/util.js');
const _    = require('lodash');

const parse = () => {
  return util.loadFileContent(`${__dirname}/test.txt`)
  .then(content => _.dropRight(_.split(content, '\r\n')))
  .then(links => console.log(links.length))
  .catch(console.log);
};

parse();
