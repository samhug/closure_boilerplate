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
 * Unit tests for the abstract classes relief.rpc.Command and
 * relief.rpc.Command.CommandResponse.
 */

goog.require('relief.rpc.Command');
goog.require('relief.testing.stubFn');



var stubFn,
    $ = window;

function setUpPage() {
  stubFn = relief.testing.stubFn;
}


function setUp() {
}

// Linter yells if these are consolidated into one assignment.  :(
var onSuccess = function() { alert('onSuccess'); };
var onFailure = function() { alert('onFailure'); };
var commandID = 'testID',
    url = '/some/path',
    method = 'GET',
    maxRetries = 10;


/**
 * Create a command objects with test values.  If default values are desired for
 * the optional arguments, just don't pass them in.
 *
 * @param {boolean=} opt_inclOptionals Whether to include optional arguments to
 *    the constructor.
 * @return {relief.rpc.Command} A stock command object.
 */
function createCommand(opt_inclOptionals) {
  var cmd = opt_inclOptionals ?
                new relief.rpc.Command(onSuccess, onFailure,
                                       commandID, url, method, maxRetries) :
                new relief.rpc.Command(onSuccess, onFailure, commandID, url);
  return cmd;
}


/**
 * Test that the constructor properly stores the parameters.
 */
$['test Constructor stores parameters properly'] = function() {
  var cmd = createCommand(true);

  assertEquals('onSuccess not saved correctly.',
               onSuccess, cmd.callersOnSuccess);
  assertEquals('onFailure not saved correctly.',
               onFailure, cmd.callersOnFailure);

  assertEquals('commandID not saved correctly.', commandID, cmd.commandID);
  assertEquals('url not saved correctly.', url, cmd.url);
  assertEquals('method not saved correctly.', method, cmd.method);
  assertEquals('maxRetries not saved correctly.', maxRetries, cmd.maxRetries);
};


/**
 * Test that the constructor sets proper defaults when optional arguments are
 * left out.
 */
$['test Constructor stores default parameters properly'] = function() {
  var cmd = createCommand();

  assertEquals('onSuccess not saved correctly.',
               onSuccess, cmd.callersOnSuccess);
  assertEquals('onFailure not saved correctly.',
               onFailure, cmd.callersOnFailure);

  assertEquals('commandID not saved correctly.', commandID, cmd.commandID);
  assertEquals('url not saved correctly.', url, cmd.url);
  assertEquals('method not saved correctly.', 'GET', cmd.method);
  assertUndefined('maxRetries not saved correctly.', cmd.maxRetries);
};


/**
 * Test that default flags are set correctly.
 */
$['test Default flags are set properly'] = function() {
  var cmd = createCommand();

  assertFalse('readFromCache flag should default to false.', cmd.readFromCache);
  assertFalse('writeToCache flag should default to false.', cmd.writeToCache);
};


/**
 * Test that getCommandID returns the given command ID.
 */
$['test getCommandID returns the given ID'] = function() {
  var cmd = createCommand();
  assertEquals('getCommandID returned an incorrect ID.',
               commandID, cmd.getCommandID());
};


/**
 * Test that abstract methods are designated as such.
 */
$['test abstract methods point to goog.abstractMethod'] = function() {
  var cmd = createCommand();
  assertEquals('cmd.onSuccess should be abstract.',
               goog.abstractMethod, cmd.onSuccess);
  assertEquals('cmd.onFailure should be abstract.',
               goog.abstractMethod, cmd.onSuccess);
};


function tearDown() {
}
