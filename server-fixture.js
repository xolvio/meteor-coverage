/*jshint -W117, -W030 */

(function () {
  'use strict';

  if (!process.env.IS_MIRROR) {
    return;
  }
  DEBUG && console.log('[velocity-coverage] Adding server-fixture code to mirror');

  Meteor.startup(function () {
    VelocityClientCoverage.remove({});
    VelocityCoverageConnectedClients.remove({});
  });

  var Future = Npm.require('fibers/future');

  //////////////////////////////////////////////////////////////////////
  // Meteor Methods
  //
  Meteor.methods({

    /**
     * Meteor method: velocityGetServerCoverageObject
     *
     * Returns the coverage object from Istanbul instrumented code for both server and client code.
     * This method also sets updates the date on a singleton collection which the counterpart
     * client-fixture observes, and posts back its results.
     *
     * The method ensures that any clients that disconnected prior to this call have posted their
     * coverage objects to VelocityClientCoverage, and that any currently connected clients have
     * responded to the timestamp change in VelocityCoverageMessages and posted back their latest
     * coverage.
     *
     * @method velocityGetServerCoverageObject
     * @return a future that contains both the server and client coverage objects
     */
    velocityGetCoverageObjects: function () {

      var now = Date.now();
      VelocityCoverageMessages.upsert('postBack', {$set: { touchTime: now }});

      var f = new Future();
      var retry = new Retry({
        baseTimeout: 500,
        maxTimeout: 5000
      });
      var tries = 0,
          totalRetries = 5;
      var checkClientCoverage = function () {

        var allCoverageObjectsReady = true;

        var connectedClients = VelocityCoverageConnectedClients.find().fetch();

        // TODO This only ever had one client. See velocityRegisterCoverageClient comments below
        DEBUG && console.log('[velocity-coverage] connected clients connectionIds: ', _.pluck(connectedClients, 'connectionId'));
        _.each(connectedClients, function (connectedClient) {
          DEBUG && console.log('[velocity-coverage] checking coverage object for client', connectedClient.connectionId);
          if (VelocityClientCoverage.find({connectionId: connectedClient.connectionId}).fetch() < 1) {
            DEBUG && console.log('[velocity-coverage] found coverage object for client', connectedClient.connectionId);
            allCoverageObjectsReady = false;
          }
        });

        // TODO this needs to be aware of the time when VelocityCoverageMessages was updated and should wait for currently connected clients to all have that time
        // TODO it should also track any disconnected clients prior to the VelocityCoverageMessages being updated and ensure they posted a coverage object before they disconnected
        if (allCoverageObjectsReady) {
          retry.clear();
          DEBUG && console.log('[velocity-coverage] got client coverage object');

          f.return({
            server: GLOBAL.__coverage__,
            clientCoverageObjects: VelocityClientCoverage.find().fetch()
          });
          return;
        }
        if (tries < totalRetries) {
          DEBUG && console.log('[velocity-coverage] retrying to get client coverage object (' + (tries + 1) + '/' + totalRetries + ')');
          retry.retryLater(++tries, checkClientCoverage);
        } else {
          console.error('[velocity-coverage] failed to get coverage back from all clients');
          f.throw('[velocity-coverage] failed to get coverage back from all clients');
        }
      };
      checkClientCoverage();
      this.unblock();
      return f.wait();

    }, // end velocityGetServerCoverageObject

    /**
     * Meteor method: velocityClientCoverageInsert
     *
     * Inserts a document into the VelocityClientCoverage. This is needed for the client to
     * call, before the page unloads in case of a test navigating away from the page, so that
     * the coverage object is not lost.
     *
     * @method velocityClientCoverageInsert
     */
    velocityClientCoverageInsert: function (object) {
      VelocityClientCoverage.insert(object);
    },

    /**
     * Meteor method: velocityRegisterCoverageClient
     *
     * The client-fixture calls this method on startup so we can track the clients. This is
     * needed so that we know how many coverage objects to collect at the end of a test run.
     *
     * @method velocityRegisterCoverageClient
     */
    // TODO This has no knowledge of how many total clients are going to register. Velocity should have the responsibility of starting browsers for frameworks with unique ids
    velocityRegisterCoverageClient: function (connectionId) {
      DEBUG && console.log('[velocity-coverage] client registered with id ', connectionId);
      VelocityCoverageConnectedClients.insert({connectionId: connectionId});
    }

  });

  // TODO make this keep track of clients that were once connected but disconnected, so we can make sure they posted their coverage
  Meteor.onConnection(function (connection) {
    connection.onClose(function () {
      console.log('[velocity-coverage] client disconnected with id', connection.id);
    });
  });

})();
