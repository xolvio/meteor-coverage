/*jshint -W117 */

(function () {
  'use strict';

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
     * client-fixture observes, and posts back its results
     *
     * @method velocityGetServerCoverageObject
     * @return a future that contains both the server and client coverage objects
     */
    velocityGetServerCoverageObject: function () {

      // TODO
      var now = Date.now();
      VelocityClientCoverage.remove({});
      VelocityCoverageMessages.upsert('postBack', {$set: { touchTime: now }});

      // create a future that waits on the clients coverage postback, making sure 'now' is matched up

      var f = new Future();
      var retry = new Retry({
        baseTimeout: 500,
        maxTimeout: 5000
      });
      var tries = 0,
          done = false;
      var checkClientCoverage = function () {
        console.log('VelocityClientCoverage', VelocityClientCoverage.find().fetch());
        if (!done) {
          if (VelocityClientCoverage.find().fetch().length !== 0) {
            done = true;
            retry.clear();
            f.return({
              server: GLOBAL.__coverage__,
              client: VelocityClientCoverage.find().fetch()[0]
            });
          }
          if (tries < 5) {
            DEBUG && console.log('[velocity-coverage] retrying to get coverage');
            retry.retryLater(++tries, checkClientCoverage);
          } else {
            console.error('[velocity-coverage] failed to get coverage back from client');
            f.throw('Problemz');
          }
        }
      };
      checkClientCoverage();
      this.unblock();
      return f.wait();

    } // end velocityGetServerCoverageObject

  });

})();
