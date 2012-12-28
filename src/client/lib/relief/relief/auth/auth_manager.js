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
 * Provides the AuthManager abstract class which defines the base
 * authentication interface required by the NavManager.  It is expected that
 * developers extend this functionality to fit the authorization scheme for
 * their apps.
 */


goog.provide('relief.auth.AuthManager');

goog.require('goog.events.EventTarget');



/**
 * AuthManager is an abstract class which provides the interface for auth
 * managers.  It extends EventTarget with the expectation that its subclasses
 * will accept listeners for and dispatch authentication events such as login
 * and logout.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 */
relief.auth.AuthManager = function() {
  goog.base(this);
};
goog.inherits(relief.auth.AuthManager, goog.events.EventTarget);


/**
 * In addition to letting clients add listeners for auth/auth events,
 * AuthManager provides the ability to directly query the object for its
 * user's current authorization status via the getCurrentUser method.
 * This method requires a callback since it is possible it will be called while
 * a request to the server for these details is being made.
 *
 * @param {function(relief.auth.User)} callback The client's callback.
 */
relief.auth.AuthManager.prototype.getCurrentUser = goog.abstractMethod;
