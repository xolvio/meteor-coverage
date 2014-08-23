/*jshint -W117, -W097 */
"use strict";

Package.describe({
  summary: 'Velocity Coverage, Istanbul code coverage for Meteor'
});

Npm.depends({
  'connect': '2.9.0',
  'fs-extra': '0.10.0',
  'lodash': '2.4.1',
  'glob': '3.2.9',
  'istanbul': '0.3.0',
  'ibrik': '1.1.1'
});

Package.on_use(function (api) {
  api.use('check');
  api.use('retry');
  api.use('velocity');
  api.use('http');

  api.export('VelocityCoverageMessages', ['client', 'server']);
  api.export('VelocityClientCoverage', ['client', 'server']);
  api.export('VelocityCoverageConnectedClients', ['client', 'server']);

  api.add_files(['collections.js'], ['server', 'client']);
  api.add_files(['coverage.js'], 'server');
  api.add_files(['server-fixture.js'], 'server');
  api.add_files(['client-fixture.js'], 'client');

});
