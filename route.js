/*jshint -W117, -W030 */

(function () {
  'use strict';

  Router.map(function () {
    this.route('velocity-coverage', {path: '/coverage'});
  });

  var onRouteNotFound = Router.onRouteNotFound;
  Router.onRouteNotFound = function () {
    var homePath = _.filter(Router.routes, function (route) {
      return route.name !== 'velocity-coverage';
    });
    if (homePath.length > 0) {
      onRouteNotFound.apply(Router, arguments);
    } else {
      console.log("[velocity-coverage]: Suppressing Iron-Router errors because we don't think you are using it.");
    }
  };

})();