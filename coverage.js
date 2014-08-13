/*jshint -W117, -W030, -W061 */
/* global
 */

DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {

  "use strict";

  if (process.env.NODE_ENV !== 'development' || process.env.IS_MIRROR) {
    return;
  }
  DEBUG && console.log('[velocity-coverage] Adding velocity-coverage code');

  var PWD = process.env.PWD,
      fs = Npm.require('fs-extra'),
      path = Npm.require('path'),
      _ = Npm.require('lodash'),
      glob = Npm.require('glob'),
      _instrumenters = {
        istanbul: Npm.require('istanbul'),
        ibrik: Npm.require('ibrik')
      },
      coverageReportDir = path.join(PWD, 'tests/.reports/coverage');


  /**
   * Returns list of javascript filenames in Meteor app.
   *
   * Excluded directories: private, public, programs, packages, tests
   *
   * @method _getJsFiles
   * @return {Array.<String>} list of filenames
   */
  function _getJsFiles () {
    var files = glob.sync('**/*.js', { cwd: PWD });
    return _filterFiles(files);
  }

  /**
   * Returns list of coffeescript files in Meteor app.
   *
   * Excluded directories: private, public, programs, packages, tests
   *
   * @method _getCoffeeFiles
   * @return {Array.<String>} list of filenames
   */
  function _getCoffeeFiles () {
    var files = glob.sync('**/*.coffee', { cwd: PWD });
    return _filterFiles(files);
  }

  /**
   * Filters out any files in the following directories:
   *   private,
   *   public,
   *   programs,
   *   packages,
   *   tests
   *
   * @method _filterFiles
   * @param {Array} files array of filenames to filter
   * @return {Array} filenames
   */
  function _filterFiles (files) {
    return _.filter(files, function (filepath) {
      var ignore = filepath.indexOf('tests') === 0 ||
        filepath.indexOf('private') === 0 ||
        filepath.indexOf('public') === 0 ||
        filepath.indexOf('programs') === 0 ||
        filepath.indexOf('packages') === 0;
      return !ignore;
    });
  }

  /**
   * Instruments a single js / coffee file, instruments it and copies it into the mirror overwriting
   * any files that exist there with the same name.
   *
   * @method instrumentFile
   * @param {String} target file path to load, relative to meteor app
   */
  function _instrumentFile (target) {
    var pwd = process.env.PWD,
        filename = path.join(pwd, target),
        ext = path.extname(filename),
        instrumenterLiteral = '.js' === ext ? 'istanbul' : '.coffee' === ext ? 'ibrik' : '',
        options = {
          'embedSource': true,
          'preserveComments': false,
          'noCompact': false
        },
        instrumenter = new _instrumenters[instrumenterLiteral].Instrumenter(options);

    if (fs.existsSync(filename)) {

      var content = fs.readFileSync(filename).toString(),
          mirrorRelativeDir = path.join(Velocity.getMirrorPath(), path.relative(process.env.PWD, path.dirname(filename)));

      DEBUG && console.log('[velocity-coverage] Instrumenting source file:', filename);

      var instrumentedCode = instrumenter.instrumentSync(content, filename);

      var targetFile = path.join(mirrorRelativeDir, path.basename(filename));
      DEBUG && console.log('[velocity-coverage] Writing instrumented file to', targetFile);
      fs.writeFileSync(targetFile, instrumentedCode);

    }
  }

  /**
   *
   * Instrument all the app js and coffee files in the mirror
   *
   * @method instrumentFiles
   */
  function instrumentFiles () {
    var then = Date.now(),
        files = _.union(_getJsFiles(), _getCoffeeFiles());

    _.each(files, function (file) {
      _instrumentFile(file);
    });
    DEBUG && console.log('[velocity-coverage] Instrumenting', files.length, ' file(s) took', Date.now() - then, 'ms');
  }

  /**
   * Collects the coverage reports for a all mirrors. This is done through the client-fixture
   * and server-fixture that are copied in to mirrors when this package is installed.
   *
   * @method _getFinalCoverageObject
   * @private
   */
  function _getHydratedCollector () {
    var collector = new _instrumenters.istanbul.Collector();
    VelocityMirrors.find().forEach(function (mirror) {
      var mirrorCoverageObjects = DDP.connect(mirror.rootUrl).call('velocityGetCoverageObjects');
      collector.add(mirrorCoverageObjects.server);
      _.each(mirrorCoverageObjects.clientCoverageObjects, function(clientCoverageObject) {
        var clientCoverage = {};
        eval('clientCoverage = ' + clientCoverageObject.coverage);
        collector.add(clientCoverage);
      });
    });
    return collector;
  }

  /**
   * Requests the coverage reports from all mirrors and their clients, and generates a coverageReporter
   * that is accessible via <main_app>/coverage
   *
   * @method coverageReporter
   */
  function coverageReporter () {

    var collector = _getHydratedCollector(),
        report = _instrumenters.istanbul.Report.create('html', {
          'dir': coverageReportDir
        });

    console.log('[velocity-coverage] wrote coverage report to', coverageReportDir + '/index.html');
    report.writeReport(collector, true);
  }

  Velocity.addPreProcessor(instrumentFiles);
  Velocity.addReporter(coverageReporter);

})();

