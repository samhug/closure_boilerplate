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
 * Implementation of re-usable stubs.
 */

goog.provide('relief.testing.stubFn');


/**
 * Returns a stub function that:
 *   - stores a flag showing whether or not it was called,
 *   - saves a reference to its arguments object,
 *   - returns the given return value when called.
 * @param {*} returnVal The value the mock function should return.
 * @return {function()} The stubbed function.
 */
relief.testing.stubFn = function(returnVal) {
  var fn = function() {
    ++fn.timesCalled;
    fn.called = true;
    fn.args = arguments;
    return returnVal;
  };

  fn.timesCalled = 0;
  fn.called = false;
  fn.args = null;

  return fn;
};
