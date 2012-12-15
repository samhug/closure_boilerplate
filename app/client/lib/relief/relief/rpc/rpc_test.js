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
 * Unit tests for relief.rpc.RPCService.
 */

goog.require('goog.array');
goog.require('goog.json');
goog.require('goog.structs.Map');

goog.require('relief.cache.Cache');
goog.require('relief.commands.GetCommand');
goog.require('relief.rpc.RPCService');
goog.require('relief.testing.stubFn');



var cache, rpc, rpcCache, stubFn, realXhrManager, headers,
    xhrMCtor, // Mock XhrManager constructor
    $ = window,
    rpcNS; // The RPCService's cache namespace.

function setUpPage() {
  stubFn = relief.testing.stubFn;
  rpcNS = relief.rpc.RPCService.cacheNS_;
  headers = new goog.structs.Map({});
}


var allAssertsReached; // needed for the integration test.
function setUp() {
  allAssertsReached = true;
  realXhrManager = goog.net.XhrManager;

  // Mock XhrManager constructor
  xhrMCtor = stubFn();
  xhrMCtor.prototype.send = stubFn();
  xhrMCtor.prototype.dispose = goog.nullFunction;
  xhrMCtor.prototype.attachEvent = goog.nullFunction;

  goog.net.XhrManager = xhrMCtor;
  cache = new relief.cache.Cache();
  rpc = new relief.rpc.RPCService(cache, headers);
  rpcCache = rpc.cache_;
}


/**
 * Test that the RPCService constructor successfully creates and stores a
 * goog.net.XhrManager and gives it the proper headers.
 */
$['test Constructor creates XHRManager'] = function() {
  assertTrue('Constructor should have created a new XhrManager.',
             xhrMCtor.called);
  assertEquals('Constructor should have been passed the headers map.',
               headers, xhrMCtor.args[1]);
};


/**
 * Test that RPCService.execute calls XhrManager.send with the proper args
 * based on the given Command object.
 */
$['test execute calls send with proper args'] = function() {
  var commandID = 'MockCommand',
      url = '/tests/send/params',
      method = 'GET',
      maxRetries = 26739,
      command = {
        getCommandID: stubFn(commandID),
        url: url,
        method: method,
        maxRetries: maxRetries,
        getData: stubFn(undefined)
      };

  var handler = rpc.handleResponse_ = stubFn();

  rpc.execute(command);

  var args = rpc.xhrMgr_.send.args;
  assertNotThrows('args[6] should be the callback and shound not throw.',
                  args[6]);

  assertEquals('First argument to send should have been the commandID.',
               commandID, args[0]);
  assertEquals('Second argument to send should have been the url.',
               url, args[1]);
  assertEquals('Third argument to send should have been the method.',
               method, args[2]);
  assertUndefined('Fourth argument to send should have been undefined.',
                  args[3]);
  assertUndefined('Fifth argument to send should have been undefined.',
                  args[4]);
  assertUndefined('Sixth argument to send should have been undefined.',
                  args[5]);
  // Test for proper handler binding in a separate test.
  assertEquals('Eigth argument to send should have been maxRetries.',
               maxRetries, args[7]);
};


/**
 * Test that the callback given to xhrMgr_.send is properly bound.
 */
$['test execute properly binds callback'] = function() {
  var commandID = 'MockCommand',
      url = '/tests/send/params',
      method = 'GET',
      maxRetries = 26739,
      command = {
        getCommandID: stubFn(commandID),
        url: url,
        method: method,
        maxRetries: maxRetries,
        getData: stubFn(undefined)
      };

  var handler = rpc.handleResponse_ = stubFn();

  rpc.execute(command);

  var args = rpc.xhrMgr_.send.args;
  assertNotThrows('7th argument to XhrMgr.send should be rpc.handleResponse_',
                  args[6]); // Executes the callback.

  assertEquals('The first argument to handleResponse_ should have been the ' +
               'commandID.', commandID, handler.args[0]);
};


/**
 * Test that execute stores the command object in rpc.runningCommands_.
 */
$['test execute stores command object'] = function() {
  var commandID = 'MockCommand',
      url = '/tests/send/params',
      method = 'GET',
      maxRetries = 26739,
      command = {
        getCommandID: stubFn(commandID),
        url: url,
        method: method,
        maxRetries: maxRetries,
        getData: stubFn(undefined)
      };

  var handler = rpc.handleResponse_ = stubFn();

  rpc.execute(command);
  assertEquals('RPC.execute should have cached the command object.',
               command, rpc.runningCommands_[commandID]);
};


/**
 * Test that handleResponse silently bails out if no command object is found.
 */
$['test handleResponse exits if command is not found'] = function() {
  var event = {
    target: {
      isSuccess: stubFn()
    }
  };

  rpc.handleResponse_('NonexistentCommandID', event);
  assertFalse('event.target.isSuccess should not have been called.',
              event.target.isSuccess.called);
};


/**
 * Test that handleResponse_ delegates to command.onSuccess for successful
 * XHR responses.
 */
$['test handleRequest delegates successful responses'] = function() {
  var commandID = 'MockCommand',
      url = '/tests/send/params',
      method = 'GET',
      maxRetries = 26739,
      command = {
        onSuccess: stubFn(),
        onFailure: stubFn(),
        getData: stubFn(undefined)
      },
      event = {
        target: {
          isSuccess: stubFn(true)
        }
      };

  rpc.runningCommands_[commandID] = command;
  rpc.handleResponse_(commandID, event);

  assertTrue('Command.onSuccess should have been called.',
             command.onSuccess.called);
  assertFalse('Command.onFailure should not have been called.',
              command.onFailure.called);
  assertEquals('Command.onSuccess should have been passed the event object.',
               event, command.onSuccess.args[0]);

  assertUndefined('handleResponse_ should have deleted the reference to the ' +
                  'command object.', rpc.runningCommands_[commandID]);
};


/**
 * Test that handleResponse_ delegates to command.onFailure for failed
 * XHR responses.
 */
$['test handleResponse delegates failed responses'] = function() {
  var commandID = 'MockCommand',
      url = '/tests/send/params',
      method = 'GET',
      maxRetries = 26739,
      command = {
        onSuccess: stubFn(),
        onFailure: stubFn(),
        getData: stubFn(undefined)
      },
      event = {
        target: {
          isSuccess: stubFn(false)
        }
      };

  rpc.runningCommands_[commandID] = command;
  rpc.handleResponse_(commandID, event);

  assertFalse('Command.onSuccess should not have been called.',
              command.onSuccess.called);
  assertTrue('Command.onFailure should have been called.',
             command.onFailure.called);
  assertEquals('Command.onFailure should have been passed the event object.',
               event, command.onFailure.args[0]);

  assertUndefined('handleResponse_ should have deleted the reference to the ' +
                  'command object.', rpc.runningCommands_[commandID]);
};


/**
 * Integration test that a request to the server is made, returns, and executes
 * the command object's onSuccess callback.
 */
$['test execute round trip success'] = function() {
  // SetUp mocks goog.net.XhrManager, so un-mock it and create a new
  // rpc service.
  goog.net.XhrManager = realXhrManager;
  rpc.dispose();
  rpc = new relief.rpc.RPCService(cache);

  var onSuccess = null,
      onFailure = null,
      commandID = 'RPCService_Integration_Test' + goog.now(),
      url = 'test_data.json?test=executeRoundTrip&time=' + goog.now(),
      command = new relief.rpc.Command(onSuccess, onFailure,
                                       commandID, url, 'GET');

  var responseText;
  command.onSuccess = function(event) {
    responseText = event.target.getResponseJson();
  };

  var failure = false;
  command.onFailure = function(event) {
    failure = event;
  };

  command.getData = stubFn(undefined);
  command.maxRetries = 0;

  rpc.execute(command);
  allAssertsReached = false;
  waitForCondition(
      function() { return responseText !== undefined || failure; },
      function() {
        allAssertsReached = true;
        if (!failure) {
          assertTrue('XHR Request did not return true.', responseText);
        }
        else {
          fail('XHR resulted in a failure: ' + goog.json.serialize(failure));
        }
      }, 50, 5000);
};


/**
 * Integration test that a request to the server is made, returns, and executes
 * the command object's onSuccess callback.
 */
$['test execute round trip failure'] = function() {
  // SetUp mocks goog.net.XhrManager, so un-mock it and create a new
  // rpc service.
  goog.net.XhrManager = realXhrManager;
  rpc.dispose();
  rpc = new relief.rpc.RPCService(cache);

  var onSuccess = null,
      onFailure = null,
      commandID = 'RPCService_Integration_Test' + goog.now(),
      url = 'nonexistent.json?test=executeRoundTrip&time=' + goog.now(),
      command = new relief.rpc.Command(onSuccess, onFailure,
                                       commandID, url, 'GET');

  var responseText;
  command.onSuccess = function(event) {
    responseText = event.target.getResponseJson();
  };

  var failure = false;
  command.onFailure = function(event) {
    failure = event;
  };

  command.getData = stubFn(undefined);
  command.maxRetries = 0;

  rpc.execute(command);
  allAssertsReached = false;
  waitForCondition(
      function() { return responseText !== undefined || failure; },
      function() {
        allAssertsReached = true;
        if (!failure) {
          fail('XHR succeeded.');
        }
      }, 50, 5000);
};


/*
 * Tests for the standalone send() method.
 */


/**
 * The send method is simply a one-off request to the XhrManager.  Make sure
 * it properly forwards the client's parameters.
 */
$['test send correctly forwards the arguments to xhrMgr.send'] = function() {
  // xhrMgr.send(id, url, opt_method, opt_content, opt_headers, opt_priority,
  //             opt_callback, opt_maxRetries)

  var args = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  rpc.send.apply(rpc, args);
  assertArrayEquals('rpc.send incorrectly passed arguments to xhrMgr.send.',
                    args, goog.array.toArray(rpc.xhrMgr_.send.args));
};


/**
 * Round-trip test for rpc.send.
 */
$['test send method round-trip'] = function() {
  // SetUp mocks goog.net.XhrManager, so un-mock it and create a new
  // rpc service.
  goog.net.XhrManager = realXhrManager;
  rpc.dispose();
  rpc = new relief.rpc.RPCService(cache);

  allAssertsReached = false;
  var callbackCalled = false,
      responseText = undefined,
      failure = false,
      callback = function(event) {
        callbackCalled = true;
        if (event.target.isSuccess()) {
          responseText = event.target.getResponseJson();
        }
        else {
          failure = event;
        }
      };

  rpc.send(
      'integration_test',
      'test_data.json?test=sendRoundTrip&time=' + goog.now(),
      'GET',
      undefined, // No POST content
      undefined, // No headers
      5, // Priority
      callback);

  waitForCondition(
      function() { return callbackCalled },
      function() {
        allAssertsReached = true;
        if (!failure) {
          assertTrue('XHR Request did not return true.', responseText);
        }
        else {
          fail('XHR resulted in a failure: ' + goog.json.serialize(failure));
        }
      }, 50, 5000);
};


/*
 * Tests for caching functionality.
 */


/**
 * Test that cache checks are skipped if cmd.readFromCache is false-y.
 */
$['test execute ignores caching if readFromCache is false'] = function() {
  var cmd = {
    getCommandID: stubFn(''),
    getData: stubFn(),
    getCacheKeys: stubFn()
  };

  rpc.execute(cmd);
  assertFalse('getCacheKeys should not have been called.',
              cmd.getCacheKeys.called);
};


/**
 * Test that the rpc service checks the cache for each key in the array returned
 * by getCacheKeys().
 */
$['test execute checks cache for all keys from getCacheKeys'] = function() {
  var keys = ['key1', 'key2', 'key3', 'key4'],
      cmd = {
        getCommandID: stubFn(''),
        getData: stubFn(),
        readFromCache: true,
        getCacheKeys: stubFn(keys)
      };

  var keyChecks = [];
  rpc.cache_.containsKey = function(key) {
    keyChecks.push(key);
  };

  rpc.execute(cmd);

  assertArrayEquals('execute did not check the cache for all keys.',
                    keys, keyChecks);
};


/**
 * Test that the rpc service calls cache.get for each key found in the cache.
 */
$['test execute gets cached value for existing cache keys'] = function() {
  var keys = ['key1', 'key2', 'key3', 'key4'],
      cmd = {
        getCommandID: stubFn(''),
        getData: stubFn(),
        readFromCache: true,
        getCacheKeys: stubFn(keys),
        onPartialCacheHit: stubFn()
      },
      rpcCache = rpc.cache_,
      matchingKeys = [keys[0], keys[1], keys[3]];

  rpcCache.set(keys[0], '0');
  rpcCache.set(keys[1], '1');
  rpcCache.set(keys[3], '3');

  var retrievedKeys = [];
  rpcCache.get = function(key) {
    retrievedKeys.push(key);
  };

  rpc.execute(cmd);
  assertArrayEquals('execute did not fetch the proper cache keys',
                    matchingKeys, retrievedKeys);
};


/**
 * Test that, for complete cache hits, onPartialCacheHit is not called, and
 * setTimeout with a bound reference to handleCacheHit_ is.
 */
$['test execute routes full cache hits to handleCacheHit'] = function() {
  var keys = ['key1', 'key2', 'key3', 'key4'],
      values = [1, 2, 3, 4],
      cmd = {
        getCommandID: stubFn(''),
        getData: stubFn(),
        readFromCache: true,
        getCacheKeys: stubFn(keys),
        onPartialCacheHit: stubFn()
      },
      rpcCache = rpc.cache_;

  rpcCache.set(keys[0], values[0]);
  rpcCache.set(keys[1], values[1]);
  rpcCache.set(keys[2], values[2]);
  rpcCache.set(keys[3], values[3]);

  var handle = rpc.handleCacheHit_ = stubFn();

  rpc.execute(cmd);

  assertFalse('handleCacheHit should not have been called in this execution ' +
              'thread.', handle.called);
  allAssertsReached = false;
  waitForCondition(function() { return handle.called; },
      function() {
        allAssertsReached = true;
        assertFalse('onPartialCacheHit should not have been called.',
                    cmd.onPartialCacheHit.called);
        var actuals = handle.args[0];

        for (var i = 0, len = actuals.length; i < len; ++i) {
          assertEquals('Incorrect cache key returned at index ' + i + '.',
                       keys[i], actuals[i].key);
          assertEquals('Incorrect cache value returned at index ' + i + '.',
                       values[i], actuals[i].value);
        }
      });
};


/**
 * Test that, for a partial cache hit, execute calls cmd.onPartialCacheHit, and
 * then executes the request.
 */
$['test execute handles partial cache hits correctly'] = function() {
  var keys = ['key1', 'key2', 'key3', 'key4'],
      values = [1, 2, 3, 4],
      cmd = {
        getCommandID: stubFn(''),
        getData: stubFn(),
        readFromCache: true,
        getCacheKeys: stubFn(keys),
        onPartialCacheHit: stubFn()
      },
      rpcCache = rpc.cache_;

  rpcCache.set(keys[0], values[0]);
  rpcCache.set(keys[1], values[1]);
  // rpcCache.set(keys[2], values[2]); Ensure a cache miss.
  rpcCache.set(keys[3], values[3]);

  var handle = rpc.handleCacheHit_ = stubFn();

  rpc.execute(cmd);

  var expected = [
    {key: keys[0], value: values[0]},
    {key: keys[1], value: values[1]},
    {key: keys[3], value: values[3]}
  ];

  actuals = cmd.onPartialCacheHit.args[0];
  for (var i = 0, len = actuals.length; i < len; ++i) {
    assertEquals('Incorrect key found at index ' + i + '.',
                 expected[i].key, actuals[i].key);
    assertEquals('Incorrect value found at index ' + i + '.',
                 expected[i].value, actuals[i].value);
  }

  assertTrue('xhr.send was not called.', rpc.xhrMgr_.send.called);

  // handleCacheHit is called in a 0ms-delayed setTimeout.

  allAssertsReached = false;
  waitForTimeout(function() {
    allAssertsReached = true;
    assertFalse('handleCacheHit_ should not have been called.',
                handle.called);
  }, 100);
};


/**
 * Test that execute does not call handleCacheHit_ or onPartialCacheHit for
 * complete cache misses, but simply executes the request.
 */
$['test execute ignores cache hit paths on full cache miss'] = function() {
  var keys = ['key1', 'key2', 'key3', 'key4'],
      cmd = {
        getCommandID: stubFn(''),
        getData: stubFn(),
        readFromCache: true,
        getCacheKeys: stubFn(keys),
        onPartialCacheHit: stubFn()
      },
      handle = rpc.handleCacheHit_ = stubFn();

  rpc.execute(cmd);

  assertFalse('onPartialCacheHit should not have been called.',
              cmd.onPartialCacheHit.called);
  assertTrue('xhr.send should have been called.', rpc.xhrMgr_.send.called);

  // handleCacheHit is called in a 0ms-delayed setTimeout.

  allAssertsReached = false;
  waitForTimeout(function() {
    allAssertsReached = true;
    assertFalse('handleCacheHit_ should not have been called.',
                handle.called);
  }, 100);
};


/**
 * Test that handleCacheHit calls the command's onCacheHit method with the value
 * retrieved from the cache.
 */
$['test handleCacheHit_ passes values to command.onCacheHit'] = function() {
  var vals = [],
      cmd = {
        onCacheHit: stubFn()
      };

  rpc.handleCacheHit_(cmd, vals);
  assertEquals('cmd.onCacheHit should have been passed the value.',
               vals, cmd.onCacheHit.args[0]);
};


/**
 * Test that handleResponse does not call getCacheValue if command.writeToCache
 * is false.
 */
$['test handleResponse_ ignores cache if writeToCache is false'] = function() {
  var cmd = {
    writeToCache: false,
    getCacheValues: stubFn()
  };

  cmd.onSuccess = cmd.onFailure = goog.nullFunction;
  rpc.runningCommands_['id'] = cmd;
  rpc.handleResponse_('id', {target: {isSuccess: stubFn(true)}});

  assertFalse('cmd.getCacheValue should not have been called.',
              cmd.getCacheValues.called);
};


/**
 * Test that handleResponse calls command.getCacheValues and caches the
 * results.
 */
$['test handleResponse_ caches values if writeToCache is true'] = function() {
  var keys = ['key1', 'key2', 'key3', 'key4'],
      values = [1, 2, 3, 4],
      toCache = [
        {key: keys[0], value: values[0]},
        {key: keys[1], value: values[1]},
        {key: keys[2], value: values[2]},
        {key: keys[3], value: values[3]}
      ],
      cmd = {
        writeToCache: true,
        getCacheValues: stubFn(toCache)
      },
      actuals = [];

  rpc.cache_.setByValue = function(key, value) {
    actuals.push({
      key: key,
      value: value
    });
  };

  cmd.onSuccess = cmd.onFailure = goog.nullFunction;
  rpc.runningCommands_['id'] = cmd;
  rpc.handleResponse_('id', {target: {isSuccess: stubFn(true)}});

  assertObjectEquals('Cached key/value objects do not match expected.',
                     toCache, actuals);
};


/**
 * Demonstrate how the XhrIo can ge accessed in a failure callback.
 */
$['test Status retrievable on failure'] = function() {
  goog.net.XhrManager = realXhrManager;
  
  rpc = new relief.rpc.RPCService(cache, headers);

  var handlerRun = false,
      status,
      typeHeader;
  var onSuccess = goog.nullFunction,
      onFailure = function(e) {
        status = e.target.getStatus();
        typeHeader = e.target.getResponseHeader('Content-Type');

        handlerRun = true;
      },
      url = 'nonexistent/path.txt';

  var cmd = new relief.rpc.Command(goog.nullFunction, goog.nullFunction,
                                   'asdf', url);
  cmd.onFailure = onFailure;
  cmd.onSuccess = goog.nullFunction;
  cmd.maxRetries = 0;

  rpc.execute(cmd);
  waitForCondition(function() { return handlerRun}, function() {
      assertEquals('Could not retrieve the status of the failed request.',
                       status, 404);
      assertEquals('Unexpected content type header.', typeHeader, 'text/html');
    }, 10, 5000);
};


/**
 * Test that the command object's requestXhrIo method is called before
 * executing the server request.
 */
$['test Command#requestXhrIo called before request is made'] = function() {
  goog.net.XhrManager = realXhrManager;
  
  rpc = new relief.rpc.RPCService(cache, headers);

  var id = 'id',
      xhrIo = {},
      cmd = {
        requestXhrIo: stubFn()
      };

  rpc.runningCommands_[id] = cmd;
  rpc.xhrMgr_.dispatchEvent(new realXhrManager.Event(goog.net.EventType.READY,
                                                     rpc.xhrMgr_, id, xhrIo));

  assertTrue('cmd.requestXhrIo should have been called.',
             cmd.requestXhrIo.called);
  assertEquals('cmd.requestXhrIo should have been passed the XhrIo instance.',
               xhrIo, cmd.requestXhrIo.args[0]);
};


function tearDown() {
  goog.net.XhrManager = realXhrManager;
  rpc.dispose();
  rpc = null;

  if (! allAssertsReached) {
    fail('The final assert in the integration test did not get reached.');
  }
}


var testCase = new goog.testing.ContinuationTestCase(document.title);
testCase.autoDiscoverTests();
G_testRunner.initialize(testCase);
