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
 * Unit tests for the class relief.auth.PublicAuthManager.
 */

goog.require('relief.auth.PublicAuthManager');



var $ = window;

function setUp() {
  auth = new relief.auth.PublicAuthManager();
}


/**
 * Test proper subclass relationship.
 */
$['test subclassing set up properly'] = function() {
  assertTrue('PublicAuthManager is not a sublcass of EventTarget.',
             auth instanceof goog.events.EventTarget);
  assertTrue('PublicAuthManager is not a subclass of AuthManager.',
             auth instanceof relief.auth.AuthManager);
};


/**
 * Test getCurrentUser calls its callback with the current user.
 */
$['test getCurrentUser asynchronously calls callback with user'] = function() {
  var callback = function(givenUser) {
    callback.called = true;
    testCase.continueTesting();
    assertEquals('getCurrentUser was not passed the correct user object.',
                 auth.user_, givenUser);
  };

  callback.called = false;
  auth.getCurrentUser(callback);
  assertFalse('Callback should not have been called yet.', callback.called);

  testCase.waitForAsync('Call to getCurrentUser');
};


var testCase = new goog.testing.AsyncTestCase.createAndInstall(document.title);
