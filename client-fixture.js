/*jshint -W117, -W030 */

(function () {
  'use strict';

  /**
   * When the coverage reporter is called by velocity, it creates an timestamped object in the VelocityCoverageMessages collection
   * This client listens to that collection, and then posts back its coverage report into the VelocityClientCoverage collection
   */
  VelocityCoverageMessages.find().observeChanges({
    changed: function () {
      VelocityClientCoverage.insert({
        coverage: JSON.stringify(__coverage__)
      });
    }
  });

  // TODO
  // handle the case of the browser navigating away and the coverage report being lost

})();
