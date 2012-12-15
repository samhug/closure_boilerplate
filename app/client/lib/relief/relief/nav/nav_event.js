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
 * Provides an event and event type for listening to the relief.nav.NavManager
 * for navigation changes.
 */

goog.provide('relief.nav.EventType');
goog.provide('relief.nav.NavEvent');

goog.require('goog.events.Event');


/**
 * Navigation event strings.
 * @enum {string}
 */
relief.nav.EventType = {
  NAVIGATE: goog.events.getUniqueId('navigate_to_path')
};



/**
 * An event class that provides the event type (relief.nav.EventType.NAVIGATE),
 * the path for the current navigation, and the target (the NavManager).
 *
 * @param {relief.nav.Path} path The path object for this nav event.
 * @param {relief.nav.NavManager} target The target for this event.
 *
 * @constructor
 * @extends {goog.events.Event}
 */
relief.nav.NavEvent = function(path, target) {
  goog.base(this, relief.nav.EventType.NAVIGATE, target);

  /**
   * The path object for this navigation.
   * @type {relief.nav.Path}
   */
  this.path = path;
};
goog.inherits(relief.nav.NavEvent, goog.events.Event);


/**
 * @override
 */
relief.nav.NavEvent.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  delete this.path;
};
