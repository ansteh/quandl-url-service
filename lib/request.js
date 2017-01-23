'use strict';
const got = require('got');

let config;
try {
  config = require('./config.json');
} catch (err) {
  config = {};
}

const request = (url) => {
  url = config.apiKey ? `${url}?api_key=${config.apiKey}` : url;
  return got(url)
    .then(response => {
      console.log(response.body);
    });
};

module.exports = { request };
