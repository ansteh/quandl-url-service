'use strict';
const util   = require('../lib/util.js');
const _      = require('lodash');
const fs     = require('fs');
const moment = require('moment');

const parse = (filename) => {
  let dateStr = _.replace(filename, '.txt', '');
  let date = moment(dateStr, 'DD-MM-YYYY').toDate();

  return util.loadFileContent(`${__dirname}/daily-links/${filename}`)
  .then(content => _.dropRight(_.split(content, '\r\n')))
  .then(links => _.map(links, (link) => {
    return { date, link };
  }));
};

const getFiles = (folder) => {
  return new Promise((resolve, reject) => {
    fs.readdir(folder, (err, files) => {
      err ? reject(err) : resolve(files);
    })
  });
};

getFiles(`${__dirname}/daily-links`)
.then(files => Promise.all(_.map(files, parse)))
.then(batches => _.flatten(batches))
.then(links => console.log(links.length))
.catch(console.log);
