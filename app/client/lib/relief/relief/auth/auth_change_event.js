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
 * Provides an event type and interface for authentication/authorization
 * change events.
 */

goog.provide('relief.auth.AuthChangeEvent');
goog.provide('relief.auth.EventType');

goog.require('goog.events');


/**
 * An event type for auth/auth changes.
 * @enum {string}
 */
relief.auth.EventType = {
  /**
  * The event type for which the NavManager registers itself as a listener on
  * the AuthManager.
  */
  AUTH_CHANGE: goog.events.getUniqueId('auth_change')
};



/**
 * An interface describing the expected properties of an AuthChangeEvent
 * object.
 *
 * @interface
 */
relief.auth.AuthChangeEvent = function() {};


/**
 * A type property representing the change.
 * @type {string}
 */
relief.auth.AuthChangeEvent.prototype.type;


/**
 * An object representing the updated User.
 * @type {relief.auth.User}
 */
relief.auth.AuthChangeEvent.prototype.user;
