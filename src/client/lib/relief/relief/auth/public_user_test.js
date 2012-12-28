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
 * Unit tests for the class relief.auth.PublicUser.
 */

goog.require('relief.auth.PublicUser');



var $ = window;

function setUp() {
  user = new relief.auth.PublicUser();
}


/**
 * checkAuthorized should always return true for the PublicUser class.
 */
$['test checkAuthorized returns true'] = function() {
  assertTrue(user.checkAuthorized());
  assertTrue(user.checkAuthorized(function() {}));
};


/**
 * The "equals()" method should always return true when presented with any
 * instance of PublicUser.
 */
$['test equals returns true'] = function() {
  assertTrue(user.equals(new relief.auth.PublicUser()));
  assertTrue(user.equals(user));
  assertFalse(user.equals({}));
  assertFalse(user.equals());
};


/**
 * Check that clone returns a new PublicUser object.
 */
$['test clone returns new PublicUser'] = function() {
  var copy = user.clone();

  assertNotEquals('clone should not return the same object.',
                  user, copy);
  assertTrue('clone should return an instance of PublicUser.',
             copy instanceof relief.auth.PublicUser);
};
