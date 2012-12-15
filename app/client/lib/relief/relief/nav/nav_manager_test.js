// Copyright 2011 Jay Young. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview
 *
 * Unit tests for relief.nav.NavManager.
 */

goog.require('goog.functions');
goog.require('goog.json');

goog.require('relief.auth.EventType');
goog.require('relief.nav.NavManager');
goog.require('relief.testing.stubFn');


/*
 * Utility functions to easily mock dependencies.
 */

var realGoogHistory, fakeHistory = function() {};


/**
 * Get a mock relief.nav.Path object with a fully mocked handler.
 * @return {Object} A mock relief.nav.Path object.
 */
function getMockPath() {
  var handler = stubFn();
  handler.prototype.handle = stubFn();
  handler.prototype.transition = stubFn();

  return {
    handler: handler
  };
}


/**
 * Some tests test a static method on Nav, which we can access via
 * Nav.prototype.<method>.  When this is the case, we need to fill the nav
 * variable with something that has a history_ property with a dispose method
 * so tearDown doesn't freak out.
 */
function setMockNav() {
  nav = {
    dispose: goog.nullFunction
  };
}


/**
 * Mock or un-mock goog.history.History
 * @param {boolean} mock Mocks History class if true; unmocks if false.
 * @param {function()=} opt_constructor The mock constructor, if a custom one is
 *    needed.
 */
function mockGoogHistory(mock, opt_constructor) {
  if (mock) {
    var constructor = opt_constructor || fakeHistory;
    if (goog.History !== constructor) {
      goog.History = constructor;
      goog.History.prototype = {
        setEnabled: function() {},
        dispose: function() {},
        addEventListener: function() {}
      };
    }
  }
  else {
    if (goog.History !== realGoogHistory) {
      goog.History = realGoogHistory;
    }
  }
}


var realGetHref;


/**
 * Mock relief.utils.getLocationHref to return a specific URL.
 * @param {string=} opt_newHref The URL to return when called, or blank to
 *    un-mock.
 */
function mockGetHref(opt_newHref) {
  if (opt_newHref) {
    relief.utils.getLocationHref = function() {
      return opt_newHref;
    };
  }
  else {
    relief.utils.getLocationHref = realGetHref;
  }
}

var realGetHash;


/**
 * Mock relief.utils.getLocationHash to return a specific URL hash.
 * @param {string=} opt_newHash The hash to return when called, or blank to
 *    un-mock.
 */
function mockGetHash(opt_newHash) {
  if (opt_newHash) {
    relief.utils.getLocationHash = function() {
      return opt_newHash;
    };
  }
  else {
    relief.utils.getLocationHash = realGetHash;
  }
}


/**
 * Compare two path objects.  Calls fail() method if they are not equivalent,
 * or are the same object.
 *
 * @param {relief.nav.Path} expected The path object to compare to.
 * @param {relief.nav.Path} actual The path object to test for equality.
 */
function comparePathCopies(expected, actual) {
  var message = '';

  if (expected === actual) {
    message = 'Expected and actual paths should not be the same object. ';
  }

  if (expected.hash !== actual.hash) {
    message += 'Hash properties do not match.  Expected: ' + expected.hash +
        ', Actual: ' + actual.hash + '. ';
  }
  if (expected.path !== actual.path) {
    message += 'Path properties do not match.  Expected: ' + expected.path +
        ', Actual: ' + actual.path + '. ';
  }
  if (expected.params !== actual.params) {
    message += 'Params properties do not match.  Expected: ' + expected.params +
        ', Actual: ' + actual.params + '. ';
  }
  if (expected.handler !== actual.handler) {
    message += 'Handler properties do not match.  ' +
        'Expected: ' + expected.handler + ', Actual: ' + actual.handler + '. ';
  }
  if (expected.pageConfig !== actual.pageConfig) {
    message += 'PageConfig properties do not match.  ' +
        'Expected: ' + goog.json.serialize(expected.pageConfig) +
        ', Actual: ' + goog.json.serialize(actual.pageConfig) + '. ';
  }

  if (message !== '') {
    fail(message);
  }
}


var iframe, input,
    bodyContent, navPrototype, realURLs, realRoute, realVerifyAuth,
    realOnAuthEvent, realDispose;

var urls = {
  '/auth': null,

  // Admin handlers.
  '/admin': null,
  '/admin/raid': null,
  '/admin/raids': null,
  '/admin/characters': null,
  '/admin/adjustments': null,
  '/admin/tiers': null,

  // List and Detail pages
  '': null,
  '/': null,
  '/standings': null,
  '/raid': null,
  '/raids': null,
  '/raiders': null,
  '/raider': null,
  '/items': null,
  '/item': null,
  '/adjustments': null,
  '/logs': null,
  '/labs': null,

  // Error handlers
  ':404': null, // HTTP 404 Not Found
  ':401': null, // HTTP 401 Forbidden
  ':501': null // HTTP 501 Not Implemented
};


var setUpPage = function() {
  navPrototype = relief.nav.NavManager.prototype;

  iframe = goog.dom.getElement('history_iframe');
  input = goog.dom.getElement('history_input');

  realGoogHistory = goog.History;
  realGetHref = relief.utils.getLocationHref;
  realGetHash = relief.utils.getLocationHash;
  realRoute = navPrototype.route_;
  realVerifyAuth = navPrototype.verifyAuth_;
  realOnAuthEvent = navPrototype.onAuthEvent_;
  realDispose = goog.dispose;

  bodyContent = document.getElementById('body_content');

  stubFn = relief.testing.stubFn;
};


var sp, auth, rpc, status, nav, realNavigateTo,
    $ = window;


var setUp = function() {
  auth = {
    getCurrentUser: goog.nullFunction,
    setNavManager: goog.nullFunction,
    attachEvent: goog.nullFunction
  };
  rpc = {};
  status = {};
  sp = {
    setNavManager: stubFn(),
    getAuthManager: function() { return auth; },
    getURLMap: function() { return urls; },
    getHistoryIFrame: function() { return iframe; },
    getHistoryInput: function() { return input; }
  };
};


/**
 * Test that creating a new relief.nav.Nav creates a new history object.
 */
$['test Constructor creates a goog.History object'] = function() {
  var constructorCalled = false;
  mockGoogHistory(true, function() {
    constructorCalled = true;
  });
  nav = new relief.nav.NavManager(sp);
  assertTrue('Nav constructor should have called goog.History constructor',
             constructorCalled);
};


/**
 * Test that the constructor adds the NavManager instance to the service
 * provider.
 */
$['test Constructor adds itself to ServiceProvider'] = function() {
  mockGoogHistory(true);

  nav = new relief.nav.NavManager(sp);
  assertEquals('NavManager constructor did not call sp.setNavManager.',
               nav, sp.setNavManager.args[0]);
};


/**
 * Test that the constructor sets itself as a listener on the auth manager
 * for AUTH_CHANGE events.
 */
$['test Constructor listens to auth manager for change events'] = function() {
  mockGoogHistory(true);

  auth = new goog.events.EventTarget();
  auth.setNavManager = goog.nullFunction;

  var handle = navPrototype.onAuthEvent_ = stubFn();

  nav = new relief.nav.NavManager(sp);
  auth.dispatchEvent({type: relief.auth.EventType.AUTH_CHANGE});

  assertTrue('onAuthEvent_ was not called on AUTH_CHANGE event.',
             handle.called);
};


/*
 * Test that nav.baseURL_ is properly calculated (protocol + host:port + page;
 * no trailing slash), both locally and once deployed at a variety of URL
 * forms:
 *  - Local Bald: http://localhost:8080
 *  - Local Bald w/ Slash: http://localhost:8080/
 *  - Local Bald w/ Hash: http://localhost:8080#
 *  - Local Bald w/ Slash + Hash: http://localhost:8080/#
 *  - Local w/ Page: http://localhost:8080/#/raid
 *  - Local w/ Module + Page: http://localhost:8080/#/admin/raid
 *  - Local w/ Module + Page + Args: http://localhost:8080/#/admin/raid/523
 *  - Deployed Bald: http://relief.appspot.com
 *  - Deployed Bald w/ Slash: http://relief.appspot.com/
 *  - Deployed Bald w/ Hash: http://relief.appspot.com#
 *  - Deployed Bald w/ Slash + Hash: http://relief.appspot.com/#
 *  - Deployed w/ Page: http://relief.appspot.com/#/raid
 *  - Deployed w/ Module + Page: http://relief.appspot.com/#/admin/raid
 *  - Deployed w/ Module + Page + Args:
 *        http://relief.appspot.com/#/admin/raid/523
 */


// Expected base URLs for the app when local and deployed.
var expectedLocalBaseURL = 'http://localhost:8080',
    expectedDeployedBaseURL = 'http://relief.appspot.com';


/**
 * Test Base URL determination with a bald local URL.
 */
$['test Constructor parses local baseURL properly'] = function() {
  mockGoogHistory(true);
  mockGetHref(expectedLocalBaseURL);

  nav = new relief.nav.NavManager(sp);
  assertEquals('nav.baseURL_ should equal ' + expectedLocalBaseURL,
               expectedLocalBaseURL, nav.baseURL_);
};


/**
 * Test Base URL determination with a local URL w/ a trailing '/'.
 */
$['test Constructor parses local baseURL with /'] = function() {
  mockGoogHistory(true);
  mockGetHref(expectedLocalBaseURL + '/');

  nav = new relief.nav.NavManager(sp);
  assertEquals('nav.baseURL_ should equal ' + expectedLocalBaseURL,
               expectedLocalBaseURL, nav.baseURL_);
};


/**
 * Test Base URL determination with a local URL w/ a trailing '#' (no '/').
 */
$['test Constructor parses local baseURL with #'] = function() {
  mockGoogHistory(true);
  mockGetHref(expectedLocalBaseURL + '#');

  nav = new relief.nav.NavManager(sp);
  assertEquals('nav.baseURL_ should equal ' + expectedLocalBaseURL,
               expectedLocalBaseURL, nav.baseURL_);
};


/**
 * Test Base URL determination with a local URL w/ a trailing '/#'.
 */
$['test Constructor parses local baseURL with /#'] = function() {
  mockGoogHistory(true);
  mockGetHref(expectedLocalBaseURL + '/#');

  nav = new relief.nav.NavManager(sp);
  assertEquals('nav.baseURL_ should equal ' + expectedLocalBaseURL,
               expectedLocalBaseURL, nav.baseURL_);
};


/**
 * Test Base URL determination with a local URL w/ a page token.
 */
$['test Constructor parses local baseURL with /page'] = function() {
  mockGoogHistory(true);
  mockGetHref(expectedLocalBaseURL + '/#/raid');

  nav = new relief.nav.NavManager(sp);
  assertEquals('nav.baseURL_ should equal ' + expectedLocalBaseURL,
               expectedLocalBaseURL, nav.baseURL_);
};


/**
 * Test Base URL determination with a local URL w/ a module + page token.
 */
$['test Constructor parses local baseURL with /module/page'] = function() {
  mockGoogHistory(true);
  mockGetHref(expectedLocalBaseURL + '/#/admin/raid');

  nav = new relief.nav.NavManager(sp);
  assertEquals('nav.baseURL_ should equal ' + expectedLocalBaseURL,
               expectedLocalBaseURL, nav.baseURL_);
};


/**
 * Test Base URL determination with a local URL w/ a module + page token.
 */
$['test Constructor parses local baseURL with /module/page/args'] = function() {
  mockGoogHistory(true);
  mockGetHref(expectedLocalBaseURL + '/#/admin/raid/532');

  nav = new relief.nav.NavManager(sp);
  assertEquals('nav.baseURL_ should equal ' + expectedLocalBaseURL,
               expectedLocalBaseURL, nav.baseURL_);
};


/*
 * Test deployed base URLs.
 */


/**
 * Test Base URL determination with a bald deployed URL.
 */
$['test Constructor parses deployed baseURL'] = function() {
  mockGoogHistory(true);
  mockGetHref(expectedDeployedBaseURL);

  nav = new relief.nav.NavManager(sp);
  assertEquals('nav.baseURL_ should equal ' + expectedDeployedBaseURL,
               expectedDeployedBaseURL, nav.baseURL_);
};


/**
 * Test Base URL determination with a deployed URL w/ a trailing '/'.
 */
$['test Constructor parses deployed baseURL with /'] = function() {
  mockGoogHistory(true);
  mockGetHref(expectedDeployedBaseURL + '/');

  nav = new relief.nav.NavManager(sp);
  assertEquals('nav.baseURL_ should equal ' + expectedDeployedBaseURL,
               expectedDeployedBaseURL, nav.baseURL_);
};


/**
 * Test Base URL determination with a deployed URL w/ a trailing '#' (no '/').
 */
$['test Constructor parses deployed baseURL with #'] = function() {
  mockGoogHistory(true);
  mockGetHref(expectedDeployedBaseURL + '#');

  nav = new relief.nav.NavManager(sp);
  assertEquals('nav.baseURL_ should equal ' + expectedDeployedBaseURL,
               expectedDeployedBaseURL, nav.baseURL_);
};


/**
 * Test Base URL determination with a deployed URL w/ a trailing '/#'.
 */
$['test Constructor parses deployed baseURL with #/'] = function() {
  mockGoogHistory(true);
  mockGetHref(expectedDeployedBaseURL + '/#');

  nav = new relief.nav.NavManager(sp);
  assertEquals('nav.baseURL_ should equal ' + expectedDeployedBaseURL,
               expectedDeployedBaseURL, nav.baseURL_);
};


/**
 * Test Base URL determination with a deployed URL w/ a page token.
 */
$['test Constructor parses deployed baseURL with /page'] = function() {
  mockGoogHistory(true);
  mockGetHref(expectedDeployedBaseURL + '/#/raid');

  nav = new relief.nav.NavManager(sp);
  assertEquals('nav.baseURL_ should equal ' + expectedDeployedBaseURL,
               expectedDeployedBaseURL, nav.baseURL_);
};


/**
 * Test Base URL determination with a deployed URL w/ a module + page token.
 */
$['test Constructor parses deployed baseURL with /module/page'] = function() {
  mockGoogHistory(true);
  mockGetHref(expectedDeployedBaseURL + '/#/admin/raid');

  nav = new relief.nav.NavManager(sp);
  assertEquals('nav.baseURL_ should equal ' + expectedDeployedBaseURL,
               expectedDeployedBaseURL, nav.baseURL_);
};


/**
 * Test Base URL determination with a deployed URL w/ a module + page token.
 */
$['test Constructor parses deployed baseURL with /module/page/args'] =
    function() {

  mockGoogHistory(true);
  mockGetHref(expectedDeployedBaseURL + '/#/admin/raid/532');

  nav = new relief.nav.NavManager(sp);
  assertEquals('nav.baseURL_ should equal ' + expectedDeployedBaseURL,
               expectedDeployedBaseURL, nav.baseURL_);
};


/*
 * End Base URL tests.
 */


/**
 * Test that changing the hash will cause a Navigate event
 */
$['test Hash change handles one nav event'] = function() {
  mockGoogHistory(false);

  var route = navPrototype.route_ = stubFn();

  nav = new relief.nav.NavManager(sp);
  assertEquals('Nav event should\'ve been fired once on goog.History creation.',
               1, route.timesCalled);

  // Apparently Opera takes a long time with this test, so give it a long
  // timeout.
  waitForTimeout(function() {
    assertEquals('Changing the hash token should cause exactly 1 nav callback',
                 2, route.timesCalled);
  }, 1000);

  var hash = 'TestHash',
      currentHash = location.hash,
      index = parseInt((currentHash.match(/#TestHash(\d)*/) || [0, 0])[1]) + 1;

  location.hash = hash + index;
};


/*
 * Tests for buildPath_.
 * Test for proper behavior when mapping is null, undefined, a function, or an
 * object.
 */


/**
 * Test that buildPath_ returns a proper path when given an undefined mapping
 */
$['test buildPath with undefined mapping'] = function() {
  setMockNav();
  var expected = {
    hash: 'hash',
    path: '',
    params: '',
    handler: undefined,
    pageConfig: undefined
  };

  var path = navPrototype.buildPath_('hash', 'path', 'params', undefined);
  assertEquals('hash should be the same as the given hash.',
               expected.hash, path.hash);
  assertEquals('path should be the empty string for an undefined mapping.',
               expected.path, path.path);
  assertEquals('param should be the empty string for an undefined mapping.',
               expected.params, path.params);
  assertUndefined('handler should be undefined for an undefined mapping.',
                  path.handler);
  assertUndefined('pageConfig should be undefined for an undefined mapping.',
                  path.pageConfig);
};


/**
 * Test that buildPath_ returns a proper path when given a null mapping
 */
$['test buildPath with null mapping'] = function() {
  setMockNav();
  var expected = {
    hash: 'hash',
    path: 'path',
    params: 'params',
    handler: null,
    pageConfig: undefined
  };

  var path = navPrototype.buildPath_('hash', 'path', 'params', null);
  assertEquals('hash should be the same as the given hash.',
               expected.hash, path.hash);
  assertEquals('path should be the given path for a null mapping.',
               expected.path, path.path);
  assertEquals('param should be the given params for a null mapping.',
               expected.params, path.params);
  assertNull('handler should be null for a null mapping.',
             path.handler);
  assertUndefined('pageConfig should be undefined for an undefined mapping.',
                  path.pageConfig);
};


/**
 * Test that buildPath_ returns a proper path when given a function mapping
 */
$['test buildPath with function mapping'] = function() {
  setMockNav();
  var expected = {
    hash: 'hash',
    path: 'path',
    params: 'params',
    handler: function() {'handler'},
    pageConfig: undefined
  };

  var path =
      navPrototype.buildPath_('hash', 'path', 'params', expected.handler);

  assertEquals('hash should be the same as the given hash.',
               expected.hash, path.hash);
  assertEquals('path should be the given path for a null mapping.',
               expected.path, path.path);
  assertEquals('param should be the given params for a null mapping.',
               expected.params, path.params);
  assertEquals('handler should be a reference to the given mapping.',
               expected.handler, path.handler);
  assertUndefined('pageConfig should be undefined for an undefined mapping.',
                  path.pageConfig);
};


/**
 * Test that buildPath_ returns a proper path when given a PageConfig mapping
 */
$['test buildPath with a PageConfig mapping'] = function() {
  setMockNav();

  var handler = function() {'handler'},
      pageConfig = {
        handler: handler
      },
      expected = {
        hash: 'hash',
        path: 'path',
        params: 'params',
        handler: handler,
        pageConfig: pageConfig
      };

  var path =
      navPrototype.buildPath_('hash', 'path', 'params', pageConfig);

  assertEquals('hash should be the same as the given hash.',
               expected.hash, path.hash);
  assertEquals('path should be the given path for a null mapping.',
               expected.path, path.path);
  assertEquals('param should be the given params for a null mapping.',
               expected.params, path.params);
  assertEquals('handler should be a reference to pageConfig.handler.',
               expected.handler, path.handler);
  assertEquals('pageConfig should be a reference to the given mapping.',
               pageConfig, path.pageConfig);
};


/*
 * Tests for disectPath.
 * Test for proper behavior when input is:
 * - Single page path + no params
 * - Single page path + 1 param
 * - Single page path + arbitrary params
 * - Multiple page path + no params
 * - Multiple page path + 1 param
 * - Multiple page path + arbitrary params
 *
 * Also test for paths that should not match anything in urlMap.
 */


/**
 * Test that disectPath works with an empty string.
 */
$['test disectPath with empty string'] = function() {
  mockGoogHistory(true);
  nav = new relief.nav.NavManager(sp);

  var handler = nav.urlMap_[''] = function() {};
  var path = nav.disectPath_('');
  assertEquals('path.handler should be the one we mapped to the emtpy string.',
               handler, path.handler);

  urlMap = realURLs;
};


/**
 * Test paths that should not match anything in urlMap.
 */
$['test disectPath with non-matched hash'] = function() {
  mockGoogHistory(true);
  nav = new relief.nav.NavManager(sp);

  var badHashes = [
    '/rade',
    '/admins/rai',
    '/rai',
    '/itemid',
    '/shoes',
    '/not/in/relief/urls'
  ];

  for (var i = 0, len = badHashes.length; i < len; ++i) {
    var hash = badHashes[i];
    var resultPath = nav.disectPath_(hash);

    assertEquals('Hash should be ' + hash + '.', hash, resultPath.hash);
    assertEquals('Path should be an empty string.', '', resultPath.path);
    assertEquals('Params should be an empty string.', '', resultPath.params);
    assertUndefined('Handler should be undefined for hash ' + badHashes[i],
                    resultPath.handler);
  }
};


/**
 * Test disectPath method with single page path
 */
$['test disectPath with a single page path'] = function() {
  mockGoogHistory(true);
  nav = new relief.nav.NavManager(sp);

  var raidHandler = function() {},
      urlMap = nav.urlMap_ = {
        '/raid': raidHandler
      };

  var hash = '/raid',
      expectedPath = '/raid',
      expectedParams = '',
      resultPath = nav.disectPath_(hash);

  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be an empty string.', '', resultPath.params);
  assertTrue('Handler should be our mock raidHandler function',
             resultPath.handler === raidHandler);

  // Test hash with trailing slash.
  hash += '/';
  resultPath = nav.disectPath_(hash);

  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be an empty string.', '', resultPath.params);
  assertTrue('Handler should be our mock raidHandler function',
             resultPath.handler === raidHandler);
};


/**
 * Test disectPath method with a single page path + 1 param.
 */
$['test disectPath with single page and one param'] = function() {
  mockGoogHistory(true);
  nav = new relief.nav.NavManager(sp);

  var raidHandler = function() {},
      urlMap = nav.urlMap_ = {
        '/raid': raidHandler
      };

  var hash = '/raid/2353',
      expectedPath = '/raid',
      expectedParams = '2353',
      resultPath = nav.disectPath_(hash);

  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be ' + expectedParams,
               expectedParams, resultPath.params);
  assertTrue('Handler should be our mock raidHandler function',
             resultPath.handler === raidHandler);

  // Test hash with trailing slash.
  hash += '/';
  resultPath = nav.disectPath_(hash);

  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be ' + expectedParams,
               expectedParams, resultPath.params);
  assertTrue('Handler should be our mock raidHandler function',
             resultPath.handler === raidHandler);
};


/**
 * Test disectPath method with single page path + arbitrary params.
 */
$['test disectPath with single page and arbitrary params'] = function() {
  mockGoogHistory(true);
  nav = new relief.nav.NavManager(sp);

  var raidHandler = function() {},
      urlMap = nav.urlMap_ = {
        '/raid': raidHandler
      };

  var hash = '/raid/search/Tuesdays',
      expectedPath = '/raid',
      expectedParams = 'search/Tuesdays',
      resultPath = nav.disectPath_(hash);

  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be ' + expectedParams,
               expectedParams, resultPath.params);
  assertTrue('Handler should be our mock raidHandler function',
             resultPath.handler === raidHandler);

  // Test hash with trailing slash.
  hash += '/';
  resultPath = nav.disectPath_(hash);

  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be ' + expectedParams,
               expectedParams, resultPath.params);
  assertTrue('Handler should be our mock raidHandler function',
             resultPath.handler === raidHandler);
};


/**
 * Test disectPath method with multiple page path + no params.
 */
$['test disectPath with multiple page path'] = function() {
  mockGoogHistory(true);
  nav = new relief.nav.NavManager(sp);

  var raidHandler = function() {'raidHandler'},
      adminHandler = function() {'adminHandler'},
      adminRaidHandler = function() {'adminRaidHandler'},
      urlMap = nav.urlMap_ = {
        '/admin': adminHandler,
        '/admin/raid': adminRaidHandler,
        '/raid': raidHandler
      };

  // Test for a match against a multi-page mapped URL (/admin/raid)
  var hash = '/admin/raid',
      expectedPath = '/admin/raid',
      expectedParams = '',
      resultPath = nav.disectPath_(hash);

  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be ' + expectedParams,
               expectedParams, resultPath.params);
  assertEquals('Handler should be our mock adminRaidHandler function.',
               adminRaidHandler, resultPath.handler);

  // Test for a match against a single-page mapped URL ('/admin')
  delete urlMap['/admin/raid'];

  expectedPath = '/admin';
  expectedParams = 'raid';
  resultPath = nav.disectPath_(hash);
  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be ' + expectedParams,
               expectedParams, resultPath.params);
  assertEquals('Handler should be our mock adminHandler function',
               adminHandler, resultPath.handler);

  // Test hash with trailing slash.
  hash += '/';
  resultPath = nav.disectPath_(hash);
  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be ' + expectedParams,
               expectedParams, resultPath.params);
  assertEquals('Handler should be our mock adminHandler function',
               adminHandler, resultPath.handler);
};


/**
 * Test disectPath method with multiple page path + 1 param.
 */
$['test disectPath with multiple pages and one param'] = function() {
  mockGoogHistory(true);
  nav = new relief.nav.NavManager(sp);

  var raidHandler = function() {'raidHandler'},
      adminHandler = function() {'adminHandler'},
      adminRaidHandler = function() {'adminRaidHandler'},
      urlMap = nav.urlMap_ = {
        '/admin': adminHandler,
        '/admin/raid': adminRaidHandler,
        '/raid': raidHandler
      };

  // Test for a match against a multi-page mapped URL (/admin/raid)
  var hash = '/admin/raid/2353',
      expectedPath = '/admin/raid',
      expectedParams = '2353',
      resultPath = nav.disectPath_(hash);

  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be ' + expectedParams,
               expectedParams, resultPath.params);
  assertEquals('Handler should be our mock adminRaidHandler function',
               adminRaidHandler, resultPath.handler);

  // Test for a match against a single-page mapped URL ('/admin')
  delete urlMap['/admin/raid'];

  expectedPath = '/admin';
  expectedParams = 'raid/2353';
  resultPath = nav.disectPath_(hash);
  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be ' + expectedParams,
               expectedParams, resultPath.params);
  assertEquals('Handler should be our mock adminHandler function',
               adminHandler, resultPath.handler);

  // Test hash with trailing slash.
  hash += '/';
  resultPath = nav.disectPath_(hash);
  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be ' + expectedParams,
               expectedParams, resultPath.params);
  assertEquals('Handler should be our mock adminHandler function',
               adminHandler, resultPath.handler);
};


/**
 * Test disectPath method with multiple page path + arbitrary
 */
$['test disectPath with multiple pages and arbitrary params'] = function() {
  mockGoogHistory(true);
  nav = new relief.nav.NavManager(sp);

  var raidHandler = function() {'raidHandler'},
      adminHandler = function() {'adminHandler'},
      adminRaidHandler = function() {'adminRaidHandler'},
      urlMap = nav.urlMap_ = {
        '/admin': adminHandler,
        '/admin/raid': adminRaidHandler,
        '/raid': raidHandler
      };

  // Test for a match against a multi-page mapped URL (/admin/raid)
  var hash = '/admin/raid/search/Tuesday',
      expectedPath = '/admin/raid',
      expectedParams = 'search/Tuesday',
      resultPath = nav.disectPath_(hash);

  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be ' + expectedParams,
               expectedParams, resultPath.params);
  assertEquals('Handler should be our mock adminRaidHandler function',
               adminRaidHandler, resultPath.handler);

  // Test for a match against a single-page mapped URL ('/admin')
  delete urlMap['/admin/raid'];

  expectedPath = '/admin';
  expectedParams = 'raid/search/Tuesday';
  resultPath = nav.disectPath_(hash);
  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be ' + expectedParams,
               expectedParams, resultPath.params);
  assertEquals('Handler should be our mock adminHandler function',
               adminHandler, resultPath.handler);


  // Test hash with trailing slash.
  hash += '/';
  resultPath = nav.disectPath_(hash);
  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be ' + expectedParams,
               expectedParams, resultPath.params);
  assertEquals('Handler should be our mock adminHandler function',
               adminHandler, resultPath.handler);
};


/**
 * Paths mapped to null handlers are used to denote not-yet-implemented
 * handlers.  Make sure that disectPath correctly finds these mappings and
 * properly sets the path and params parameters.
 */
$['test disectPath finds null handler mappings'] = function() {
  mockGoogHistory(true);
  nav = new relief.nav.NavManager(sp);

  urls['/test/path'] = null;

  var hash = '/test/path/params/5/234',
      expectedPath = '/test/path',
      expectedParams = 'params/5/234';

  var resultPath = nav.disectPath_(hash);
  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be ' + expectedParams,
               expectedParams, resultPath.params);
  assertNull('Handler should be null', resultPath.handler);

  // Test hash with trailing slash.
  hash += '/';
  var resultPath = nav.disectPath_(hash);
  assertEquals('Hash should be ' + hash, hash, resultPath.hash);
  assertEquals('Path should be ' + expectedPath, expectedPath, resultPath.path);
  assertEquals('Params should be ' + expectedParams,
               expectedParams, resultPath.params);
  assertNull('Handler should be null', resultPath.handler);

  delete urls['/test/path'];
};


/**
 * Test that route_ correctly sets nav.page_, referer_, and
 * backtrackingReferer_.
 */
$['test route transitions page referers'] = function() {
  mockGoogHistory(true);

  var realVerifyAuth = navPrototype.verifyAuth_;
  navPrototype.verifyAuth_ = goog.nullFunction;

  nav = new relief.nav.NavManager(sp);

  assertEquals('page_ should default to an empty string.', '', nav.page_.hash);
  assertEquals('referer_ should default to an empty string.',
               '', nav.referer_.hash);
  assertEquals('backtrackingReferer_ should default to an empty string.',
               '', nav.backtrackingReferer_.hash);

  var firstToken = '/fake/path';
  nav.route_({token: firstToken});
  assertEquals('page_ should now be ' + firstToken,
               firstToken, nav.page_.hash);
  assertEquals('referer_ should still be an empty string.',
               '', nav.referer_.hash);
  assertEquals('backtrackingReferer_ should still be an empty string.',
               '', nav.backtrackingReferer_.hash);

  var secondToken = '/wrong/path';
  nav.route_({token: secondToken});
  assertEquals('page_ should now be ' + secondToken,
               secondToken, nav.page_.hash);
  assertEquals('referer_ should now be ' + firstToken,
               firstToken, nav.referer_.hash);
  assertEquals('backtrackingReferer_ should still be an empty string.',
               '', nav.backtrackingReferer_.hash);

  var thirdToken = '/unreal/path';
  nav.route_({token: thirdToken});
  assertEquals('page_ should now be ' + thirdToken,
               thirdToken, nav.page_.hash);
  assertEquals('referer_ should now be ' + secondToken,
               secondToken, nav.referer_.hash);
  assertEquals('backtrackingReferer_ should now be ' + firstToken,
               firstToken, nav.backtrackingReferer_.hash);

  navPrototype.verifyAuth_ = realVerifyAuth;
};


/**
 * Test that route_ correctly sets nav.page_ and referer_ on rollback.
 */
$['test route transitions page referer on rollback'] = function() {
  mockGoogHistory(true);

  var realVerifyAuth = navPrototype.verifyAuth_;
  navPrototype.verifyAuth_ = goog.nullFunction;

  nav = new relief.nav.NavManager(sp);

  assertEquals('page_ should default to an empty string.',
               '', nav.page_.hash);
  assertEquals('referer_ should default to an empty string.',
               '', nav.referer_.hash);
  assertEquals('backtrackingReferer_ should default to an empty string.',
               '', nav.backtrackingReferer_.hash);

  var firstToken = '/fake/path';
  nav.route_({token: firstToken});
  assertEquals('page_ should now be ' + firstToken,
               firstToken, nav.page_.hash);
  assertEquals('referer_ should still be an empty string.',
               '', nav.referer_.hash);
  assertEquals('backtrackingReferer_ should still be an empty string.',
               '', nav.backtrackingReferer_.hash);

  navPrototype.verifyAuth_ = realVerifyAuth;
};


/**
 * Test that Nav.route_ calls auth.getAuthStatus if nav.authStatus_ is null.
 */
$['test route calls auth.getCurrentUser when user is null'] = function() {
  mockGoogHistory(true);

  var verifyAuth = navPrototype.verifyAuth_ = stubFn(),
      getUser = auth.getCurrentUser = stubFn();

  nav = new relief.nav.NavManager(sp);

  nav.route_({token: '/admin/raid'});
  assertTrue('getAuthStatus should have been called when nav.authStatus_ is ' +
             'null.', getUser.called);
  assertFalse('verifyAuth should not have been called when nav.authStatus_ is' +
              ' null', verifyAuth.called);
};


/**
 * Test that route_ calls verifyAuth_ if this.user_ is non-null.
 */
$['test route calls verifyAuth when user is non-null'] = function() {
  mockGoogHistory(true);

  var verifyAuth = navPrototype.verifyAuth_ = stubFn(),
      getUser = auth.getCurrentUser = stubFn(),
      user = {};

  nav = new relief.nav.NavManager(sp);

  nav.user_ = user;
  nav.route_({token: '/admin/raid'});
  assertTrue('verifyAuth should have been called when nav.authStatus_ is ' +
             'null', verifyAuth.called);
  assertFalse('getAuthStatus should not have been called when ' +
              'nav.authStatus_ is null.', getUser.called);
};


/**
 * Test that onAuthEvent_ calls verifyAuth with the current path and the
 * new user.
 */
$['test onAuthEvent passes path and user to verifyAuth'] = function() {
  mockGoogHistory(true);

  nav = new relief.nav.NavManager(sp);
  var verifyAuth = nav.verifyAuth_ = stubFn(),
      path = nav.page_ = {},
      event = {user: {}};

  nav.onAuthEvent_(event);
  assertEquals('onAuthEvent did not pass the current path to verifyAuth.',
               path, verifyAuth.args[0]);
  assertEquals('onAuthEvent did not pass the user object to verifyAuth.',
               event.user, verifyAuth.args[1]);
};


/**
 * Test that verifyAuth_ saves the user in this.user_
 */
$['test verifyAuth stores reference to user'] = function() {
  mockGoogHistory(true);

  var activateHandler = navPrototype.activateHandler_ = stubFn();
  nav = new relief.nav.NavManager(sp);

  var user = {checkAuthorized: goog.functions.TRUE};
  nav.verifyAuth_({}, user);

  assertEquals('verifyAuth did not store a reference to the user object.',
               user, nav.user_);
};


/**
 * Test that verifyAuth_ sets handler to urls[':401'] if user.checkAuthorized
 * returns false.
 */
$['test verifyAuth sets 401 if user is not authorized'] = function() {
  mockGoogHistory(true);

  var realUnauthHandler = urls[':401'],
      realActivateHandler = navPrototype.activateHandler_,
      path = {
        hash: '/admin/raid/5',
        path: '/admin/raid',
        params: '5',
        handler: function() {'original handler'}
      },
      unauthHandler = urls[':401'] = function() {'unauthHandler'};

  var activateHandler = navPrototype.activateHandler_ = stubFn();

  nav = new relief.nav.NavManager(sp);

  var user = nav.user_ = {
    checkAuthorized: stubFn(false)
  };

  nav.verifyAuth_(path, user);

  assertTrue('user.checkAuthorized was not called.',
             user.checkAuthorized.called);
  assertEquals('verifyAuth did not set path.handler to the 401 handler.',
               unauthHandler, activateHandler.args[0].handler);

  urls[':401'] = realUnauthHandler;
  navPrototype.activateHandler_ = realActivateHandler;
};


/**
 * Test that verifyAuth_ does not overwrite path.handler if user.checkAuthorized
 * returns true.
 */
$['test verifyAuth allows handler if user is authorized'] = function() {
  mockGoogHistory(true);

  var realUnauthHandler = urls[':401'],
      realActivateHandler = navPrototype.activateHandler_,
      path = {
        hash: '/admin/raid/5',
        path: '/admin/raid',
        params: '5',
        handler: function() {'original handler'}
      },
      expectedHandler = path.handler,
      unauthHandler = urls[':401'] = function() {'unauthHandler'};

  navPrototype.activateHandler_ = stubFn();

  nav = new relief.nav.NavManager(sp);

  var user = nav.user_ = {
    checkAuthorized: stubFn(true)
  };

  nav.verifyAuth_(path, user);

  assertTrue('user.checkAuthorized was not called.',
             user.checkAuthorized.called);
  assertEquals('verifyAuth did not set path.handler to the 401 handler.',
               expectedHandler, path.handler);

  urls[':401'] = realUnauthHandler;
  navPrototype.activateHandler_ = realActivateHandler;
};


/**
 * Test that verifyAuth calls activateHandler_ with isTransition = false when
 * there is no pre-existing handler (nav.activeHandler_ === null).
 */
$['test verifyAuth calls activateHandler if no active handler'] = function() {
  mockGoogHistory(true);

  var realActivateHandler = navPrototype.activateHandler_,
      path = {handler: null},
      user = {checkAuthorized: stubFn(true)},
      activateHandler = navPrototype.activateHandler_ = stubFn();

  nav = new relief.nav.NavManager(sp);
  nav.verifyAuth_(path, user);

  assertEquals('ActiveHandler should have been passed the path object.',
               path, activateHandler.args[0]);
  assertFalse('ActiveHandler should have been passed isTransition = false.',
              activateHandler.args[1]);

  navPrototype.activateHandler_ = realActivateHandler;
};


/**
 * Test that verifyAuth calls exit on the active handler if the new one is
 * not the same type.
 */
$['test verifyAuth calls activeHandler.exit if handler is different class'] =
    function() {

  mockGoogHistory(true);

  var exitCalled = false,
      path = {
        handler: function() { 'New Handler'; }
      },
      user = {
        checkAuthorized: stubFn(true)
      };

  nav = new relief.nav.NavManager(sp);
  nav.activeHandler_ = {
    exit: function(onExit) {
      exitCalled = true;
      onExit();
    }
  };

  var realOnExit = navPrototype.onExit_;
  var onExit = navPrototype.onExit_ = stubFn();

  nav.verifyAuth_(path, user);
  assertTrue('ActiveHandler.exit should have been called.', exitCalled);
  assertTrue('VerifyAuth should have passed a bound onExit_ reference to ' +
             'activeHandler.exit.', onExit.called);

  navPrototype.onExit_ = realOnExit;
};


/**
 * Test that if nav.activeHandler_ is an instance of path.handler, verifyAuth:
 * - does NOT call nav.activeHandler_.exit()
 * - does call nav.activateHandler_ with isTransition === true
 */
$['test verifyAuth does not exit activeHandler if same class'] = function() {
  mockGoogHistory(true);

  var handler = function() { 'Constructor'; },
      path = {
        handler: handler
      },
      user = {
        checkAuthorized: stubFn(true)
      };

  var exit = handler.prototype.exit = stubFn(),
      realActivateHandler = navPrototype.activateHandler_,
      activateHandler = navPrototype.activateHandler_ = stubFn();

  nav = new relief.nav.NavManager(sp);
  nav.activeHandler_ = new handler();

  nav.verifyAuth_(path, user);
  assertFalse('ActiveHandler.exit should not have been called.',
              exit.called);
  assertEquals('ActivateHandler should have been passed the path object.',
               path, activateHandler.args[0]);
  assertTrue("ActivateHandler should've been called with isTransition = true.",
             activateHandler.args[1]);

  navPrototype.activateHandler_ = realActivateHandler;
};


/**
 * Test that verifyAuth calls activeHandler.exit with force = true if the
 * new handler is a :401 handler.  If the new handler is :401, that means that
 * the user isn't allowed to be viewing whatever they're viewing and the
 * handler will be shut down regardless of user desire.
 */
$['test verifyAuth calls exit(forced=true) for :401 navigations'] = function() {
  mockGoogHistory(true);

  nav = new relief.nav.NavManager(sp);
  nav.activateHandler_ = stubFn();

  var activeHandler = nav.activeHandler_ = {
    exit: stubFn()
  };
  var exit = nav.onExit_ = stubFn(),
      user = {
        checkAuthorized: stubFn(false)
      },
      handler = urls[':401'] = function() {':401'},
      path = {
        hash: '/some/url/path',
        path: '/some',
        params: 'url/path',
        handler: goog.nullFunction
      };

  goog.dispose = stubFn();
  nav.verifyAuth_(path, user);

  assertFalse('activateHandler should not have been called.',
              nav.activateHandler_.called);
  assertTrue('activeHandler.exit was not called.', activeHandler.exit.called);

  assertTrue('The second argument to activeHandler.exit should have been true.',
             activeHandler.exit.args[1]);

  // The first argument to activeHandler_.exit should be a bound nav.onExit_
  // with a new path containing the :401 handler and force=true.
  activeHandler.exit.args[0]();

  path.handler = handler; // The expected path should have the :401 handler.
  var actualPath = exit.args[0];
  comparePathCopies(path, actualPath);

  assertTrue('The second argument to nav.onExit_ should have been true.',
             exit.args[1]);
  assertTrue('goog.dispose should have been called.',
             goog.dispose.called);
  assertEquals('goog.dispose should have been passed the active handler.',
               activeHandler, goog.dispose.args[0]);
};


/**
 * Test that verifyAuth calls activeHandler.exit with force = false if the user
 * is authorized to view the path's handler.
 */
$['test verifyAuth calls exit(forced=false) for authorized navs'] = function() {
  mockGoogHistory(true);

  nav = new relief.nav.NavManager(sp);
  nav.activateHandler_ = stubFn();

  var activeHandler = nav.activeHandler_ = {
    exit: stubFn()
  };
  var exit = nav.onExit_ = stubFn(),
      user = {
        checkAuthorized: stubFn(true)
      },
      handler = function() {'authorized handler'},
      path = {
        hash: '/some/url/path',
        path: '/some',
        params: 'url/path',
        handler: handler
      };

  goog.dispose = stubFn();
  nav.verifyAuth_(path, user);

  assertFalse('activateHandler should not have been called.',
              nav.activateHandler_.called);
  assertTrue('activeHandler.exit was not called.', activeHandler.exit.called);

  assertFalse('The second argument to activeHandler.exit was not false.',
              activeHandler.exit.args[1]);

  // The first argument to activeHandler_.exit should be a bound nav.onExit_
  // with the original path and force=false.
  activeHandler.exit.args[0]();

  var actualPath = exit.args[0];
  assertEquals('The path given to onExit_ should be the original.',
               path, actualPath);

  assertFalse('The second argument to nav.onExit_ should have been false.',
              exit.args[1]);
  assertFalse('goog.dispose should not have been called.',
              goog.dispose.called);
};


/**
 * Test that nav.onExit(path, force=true, exitCompleted=true) calls
 * activateHandler_(path, false).
 */
$['test onExit(force=true, exitCompleted=true) calls activateHandler'] =
    function() {

  setMockNav();

  var path = {},
      activateHandler = nav.activateHandler_ = stubFn(),
      rollback = nav.rollback_ = stubFn();

  goog.dispose = stubFn();

  // Run the real onExit_ against our mock nav.
  navPrototype.onExit_.call(nav, path, true, true);

  assertTrue('activateHandler_ should have been called.',
             activateHandler.called);
  assertEquals('activateHandler_ should have been given the path object.',
               path, activateHandler.args[0]);
  assertFalse('rollback_ should not have been called.', rollback.called);
  assertTrue('goog.dispose should have been called.',
             goog.dispose.called);
};


/**
 * Test that nav.onExit(path, force=false, exitCompleted=true) calls
 * activateHandler_(path, false).
 */
$['test onExit(force=false, exitCompleted=true) calls activateHandler'] =
    function() {

  setMockNav();

  var path = {},
      activateHandler = nav.activateHandler_ = stubFn(),
      rollback = nav.rollback_ = stubFn();

  goog.dispose = stubFn();

  // Run the real onExit_ against our mock nav.
  navPrototype.onExit_.call(nav, path, false, true);

  assertTrue('activateHandler_ should have been called.',
             activateHandler.called);
  assertEquals('activateHandler_ should have been given the path object.',
               path, activateHandler.args[0]);
  assertFalse('rollback_ should not have been called.', rollback.called);
  assertTrue('goog.dispose should have been called.',
             goog.dispose.called);
};


/**
 * Test that nav.onExit(path, force=false, exitCompleted=true) calls
 * activateHandler_(path, false).
 */
$['test onExit(force=true, exitCompleted=false) calls activateHandler'] =
    function() {

  setMockNav();

  var path = {},
      activateHandler = nav.activateHandler_ = stubFn(),
      rollback = nav.rollback_ = stubFn();

  goog.dispose = stubFn();

  // Run the real onExit_ against our mock nav.
  navPrototype.onExit_.call(nav, path, true, false);

  assertTrue('activateHandler_ should have been called.',
             activateHandler.called);
  assertEquals('activateHandler_ should have been given the path object.',
               path, activateHandler.args[0]);
  assertFalse('rollback_ should not have been called.', rollback.called);
  assertTrue('goog.dispose should have been called.',
             goog.dispose.called);
};


/**
 * Test that nav.onExit_(path, force=false, exitCompleted=false) calls
 * rollback_();
 */
$['test onExit(force=false, exitCompleted=false) calls rollback'] = function() {
  setMockNav();

  var path = {},
      activateHandler = nav.activateHandler_ = stubFn(),
      rollback = nav.rollback_ = stubFn();

  goog.dispose = stubFn();

  // Run the real onExit against our mock nav.
  navPrototype.onExit_.call(nav, path, false);

  assertFalse('activateHandler_ should not have been called.',
              activateHandler.called);
  assertTrue('rollback_ should have been called.', rollback.called);

  assertFalse('goog.dispose should not have been called.',
              goog.dispose.called);
};


/**
 * Test that activateHandler creates a new instance of path.Handler if
 * isTransition is false.
 */
$['test activateHandler creates new handler if not a transition'] = function() {
  mockGoogHistory(true);
  nav = new relief.nav.NavManager(sp);

  var handler = stubFn(),
      path = {
        handler: handler
      },
      handle = handler.prototype.handle = stubFn(),
      transition = handler.prototype.transition = stubFn();

  nav.activeHandler_ = null;

  nav.activateHandler_(path, false);

  assertEquals('activateHandler did not pass the service provider to the ' +
               'handler constructor.', sp, handler.args[0]);
  assertEquals('activateHandler did not pass the path to handler.handle.',
               path, handle.args[0]);
  assertFalse('transition should not have been called.', transition.called);
};


/**
 * Test that activateHandler calls nav.activeHandler_.transition if
 * isTransition is true.
 */
$['test activateHandler calls activeHandler.transition on transition'] =
    function() {

  mockGoogHistory(true);

  nav = new relief.nav.NavManager(sp);

  var path = {},
      handler = nav.activeHandler_ = {},
      handle = handler.handle = stubFn(),
      transition = handler.transition = stubFn(),
      onTransition = nav.onNavigation_ = stubFn();

  nav.activateHandler_(path, true);

  assertEquals('activateHandler should have passed the path object to ' +
               'transition.', path, transition.args[0]);

  transition.args[1]();
  assertTrue('activateHandler should have passed a bound rollback method to ' +
             'transition.', onTransition.called);
};


/**
 * Test that onNavigation_ dispatches a navigation event when completed
 * is true.
 */
$['test onNavigation dispatches event when completed is true'] = function() {
  mockGoogHistory();

  nav = new relief.nav.NavManager(sp);
  nav.rollback_ = stubFn();

  var path = {};

  allAssertsReached = false;
  goog.events.listen(nav, relief.nav.EventType.NAVIGATE, function(e) {
    assertEquals('The event did not include the path.', path, e.path);
    assertEquals('The event did not include a reference to the nav manager.',
                 nav, e.target);
    allAssertsReached = true;
  });

  nav.onNavigation_(path, true);
  assertFalse('nav.rollback_ should not have been called.',
              nav.rollback_.called);
};


/**
 * Test that onNavigation_ does not fire an event and does call rollback_
 * when complete is false.
 */
$['test onNavigation rolls back when complete is false'] = function() {
  mockGoogHistory();

  nav = new relief.nav.NavManager(sp);
  nav.rollback_ = stubFn();

  goog.events.listen(nav, relief.nav.EventType.NAVIGATE, function(e) {
    fail('NavManager should not have dispatched an event.');
  });

  nav.onNavigation_(null, false);
  assertTrue('nav.rollback_ should have been called.', nav.rollback_.called);
};


/**
 * Test that the rollback method sets nav.backtracking to true and calls
 * history.back().
 */
$['test rollback rolls back navigation'] = function() {
  setMockNav();

  nav.backtracking_ = false;
  goog.global = {
    history: {
      back: stubFn()
    }
  };
  navPrototype.rollback_.call(nav);
  assertTrue('rollback did not set nav.backtracking_ to true.',
             nav.backtracking_);
  assertTrue('rollback did not call the global history.back() method.',
             goog.global.history.back.called);
};


/**
 * Test that the getReferer_ method returns a copy of the previous navigation's
 * path.
 */
$['test getReferer returns copy of referer path'] = function() {
  setMockNav();

  nav.buildPath_ = navPrototype.buildPath_;
  var pageConfig = {
    handler: function() {'handler'}
  };
  var path = nav.referer_ =
          navPrototype.buildPath_('/some/path', '/some', 'path', pageConfig),
      referer = navPrototype.getReferer.call(nav);

  comparePathCopies(path, referer);
};


var tearDown = function() {
  goog.dispose = realDispose;
  nav.dispose();
  nav = null;

  mockGoogHistory(false);
  mockGetHash();
  mockGetHref();

  location.hash = '';

  urlMap = realURLs;
  bodyContent.innerHTML = '';
  navPrototype.route_ = realRoute;
  navPrototype.verifyAuth_ = realVerifyAuth;
  navPrototype.onAuthEvent_ = realOnAuthEvent;

  if (goog.events.getTotalListenerCount() !== 0) {
    fail('Listeners left behind.');
  }
};


var testCase = new goog.testing.ContinuationTestCase(document.title);
testCase.autoDiscoverTests();
G_testRunner.initialize(testCase);
