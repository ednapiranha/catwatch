/* eslint-env node */

'use strict';

const level = require('level');
const concat = require('concat-stream');
const moment = require('moment');

const db = level('./db', {
  createIfMissing: true,
  valueEncoding: 'json'
});

exports.saveImage = function (data) {
  let date = Math.floor(Date.now() / 1000);
  db.put('photo!' + date, {
    image: data.data,
    created: date
  });
};

exports.home = function (request, reply) {
  let rs = db.createValueStream({
    gte: 'photo!',
    lte: 'photo!\xff',
    reverse: true,
    limit: 24
  });

  rs.pipe(concat((images) => {
    images.forEach((image) => {
      image.created = moment.utc(image.created).format('MMMM Do YYYY, h:mm:ss a');
    });
    reply.view('index', {
      images: images
    });
  }));

  rs.on('error', (err) => {
    console.log(err);
  });
};

exports.deleteAll = function (request, reply) {
  let rs = db.createValueStream({
    gte: 'photo!',
    lte: 'photo!\xff'
  });

  rs.pipe(concat((images) => {
    let opts = [];
    images.forEach((image) => {
      opts.push({
        type: 'del',
        key: 'photo!' + image.created
      });
    });

    db.batch(opts, (err) => {
      if (err) {
        return reply({
          error: err
        });
      }

      reply.view('index', {
        images: images
      });
    });
  }));

  rs.on('error', (err) => {
    console.log(err);
  });
};
