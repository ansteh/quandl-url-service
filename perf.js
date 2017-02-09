const _ = require('lodash');
const Promise = require('bluebird');
const async = require('async');

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

perfTestbed();

// return new Promise((resolve, reject) => {
//   async.parallel(_.map(stocks, (stock) => {
//     return (callback) => {
//       let values = stock.fitCloseDataBy(allDates);
//       console.log(stock.meta.ticker);
//       callback(null, values);
//     };
//   }), (err, dataset) => {
//     // console.log(dataset.length);
//     if(err) {
//       reject(err)
//     } else {
//       resolve(dataset);
//     }
//   });
// });

// .then((dataset) => {
//   // return _.sum(_.map(dataset, _.sum));
//   let range = _.range(dataset.length);
//   return _.map(allDates, (date, index) => {
//     return _.sum(_.map(range, slot => dataset[slot][index]));
//   });
// })
// .then(index => _.slice(index, -10))
