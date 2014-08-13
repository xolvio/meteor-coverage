/*jshint -W117, -W030 */

(function () {
  'use strict';

  Meteor.call('velocityIsMirror', function (e, isMirror) {
    if (isMirror) {

      /**
       * We register every client that connects to the mirror so that we can get back the
       * coverage reports from all of them
       */
      Meteor.call('velocityRegisterCoverageClient', Meteor.connection._lastSessionId);

      /**
       * When the coverage reporter is called by velocity, it creates an timestamped object in the VelocityCoverageMessages collection
       * This client listens to that collection, and then posts back its coverage report into the VelocityClientCoverage collection
       */
      VelocityCoverageMessages.find().observeChanges({
        changed: function () {
          Meteor.call('velocityClientCoverageInsert', {
            coverage: JSON.stringify(__coverage__),
            connectionId: Meteor.connection._lastSessionId
          });
          window.coverageCollected = true;
        }
      });

      /**
       * We also need to handle the case when the test navigates away from the app. In this case
       * we post the current coverage object back to the server which only keeps the coverage object,
       * until all tests are completed.
       */
      Meteor.startup(function () {
        $(window).bind('beforeunload', function () {
          if (!window.coverageCollected) {
            Meteor.call('velocityClientCoverageInsert', {
              coverage: JSON.stringify(__coverage__),
              connectionId: Meteor.connection._lastSessionId
            });
          }
        });
      });
    }
  });

})();
