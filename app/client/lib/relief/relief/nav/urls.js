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
 * Provides the URLMap and PageConfig typedefs.
 */

goog.provide('relief.nav.PageConfig');
goog.provide('relief.nav.URLMap');


/**
 * Defines an object that is the value of the URLMap's Key/Value pairing.  A
 * PageConfig is an object with a 'handler' property that is a
 * relief.nav.Handler constructor.  Developers can add anything else to a
 * PageConfig object that the handler might need.
 *
 * @typedef {{handler: function(new: relief.nav.Handler,
 *    !relief.nav.NavServiceProvider)}}
 */
relief.nav.PageConfig;


/**
 * Defines an object that is a mapping from URL hash values to
 * relief.nav.Handler constructor functions.
 *
 * @typedef {Object.<string, (function(new: relief.nav.Handler,
 *    !relief.nav.NavServiceProvider)|relief.nav.PageConfig|null)>}
 */
relief.nav.URLMap;
