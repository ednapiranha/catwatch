/* eslint-env node */

'use strict';

const Hapi = require('hapi');
const http = require('http');
const Inert = require('inert');
const SocketIO = require('socket.io');

const conf = require('./lib/conf');

const services = require('./lib/services');

const server = new Hapi.Server();

server.connection({
  host: conf.get('domain'),
  port: conf.get('port')
});

server.register([
  {
    register: Inert
  },
  {
    register: require('vision')
  }
], function (err) {
  if (err) {
    console.log(err);
  }

  server.views({
    engines: {
      jade: require('jade')
    },
    isCached: process.env.node === 'production',
    path: __dirname + '/views',
    compileOptions: {
      pretty: true
    }
  });
});

const routes = [
  {
    method: 'GET',
    path: '/',
    config: {
      handler: services.home
    }
  }
];

server.route(routes);

server.route({
  path: '/{p*}',
  method: 'GET',
  handler: {
    directory: {
      path: './public',
      listing: false,
      index: false
    }
  }
});

let io;

server.start(function (err) {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }

  io = SocketIO.listen(server.listener);

  io.on('connection', function(socket) {
    socket.on('save', function (data) {
      services.saveImage(data);
    });
  });
});
