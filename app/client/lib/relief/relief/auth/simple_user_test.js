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
 * Unit tests for the class relief.auth.SimpleUser.
 */

goog.require('relief.auth.SimpleUser');



var $ = window,
    user,
    authLevel = 5,
    displayName = 'Awesome Bob',
    uniqueID = 'AwesomeBob@IsAwesome.com';

function setUp() {
  user = new relief.auth.SimpleUser(authLevel, displayName, uniqueID);
}


/**
 * Test that the constructor stores the given values in the proper fields.
 */
$['test Constructor stores properties properly'] = function() {
  assertEquals('Auth level not stored correctly.',
               authLevel, user.authLevel_);
  assertEquals('Display Name not stored correctly.',
               displayName, user.displayName_);
  assertEquals('Unique ID not stored correctly.',
               uniqueID, user.uniqueID_);
};


/**
 * Test that the getters return the proper values.
 */
$['test Getters return proper values'] = function() {
  assertEquals('Auth level getter returned the wrong value.',
               authLevel, user.getAuthLevel());
  assertEquals('Display Name getter returned the wrong value.',
               displayName, user.getDisplayName());
  assertEquals('Unique ID getter returned the wrong value.',
               uniqueID, user.getUniqueID());
};


/**
 * Test that checkAuthorized returns as expected.
 */
$['test checkAuthorized returns correct values'] = function() {
  assertTrue('checkAuthorized returned false for lower-auth handler.',
             user.checkAuthorized({requiredAuth: 0}));
  assertTrue('checkAuthorized returned false for same-auth handler.',
             user.checkAuthorized({requiredAuth: 5}));
  assertFalse('checkAuthorized returned true for higher-auth handler.',
              user.checkAuthorized({requiredAuth: 10}));
};


/**
 * Test that clone returns a proper clone.
 */
$['test clone returns a proper clone'] = function() {
  var copy = user.clone();
  assertNotEquals('clone returned a reference to itself!',
                  user, copy);
  assertEquals('clone incorrectly set the copy\'s auth level.',
               authLevel, copy.authLevel_);
  assertEquals('clone incorrectly set the copy\'s display name.',
               displayName, copy.displayName_);
  assertEquals('clone incorrectly set the copy\'s unique ID.',
               uniqueID, copy.uniqueID_);
};
