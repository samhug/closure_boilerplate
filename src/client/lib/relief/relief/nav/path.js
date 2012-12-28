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
 * Path is a typedef'ed record object that represents a URL hash token and its
 * various subcomponents.
 */

goog.provide('relief.nav.Path');

goog.require('relief.nav.PageConfig');


/**
 *
 * A record type that contains the components of a URL hash token broken into:
 * - hash: the full event.token string
 * - path: the path that matches an entry in the URL map
 * - params: everything after path in hash to be passed to the handler as params
 * - handler: the relief.nav.Handler constructor registered for this path
 *    (or undefined if the path could not be matched to a mapped URL).
 *
 * @typedef {{hash: string, path: string, params: string,
 *    pageConfig: (relief.nav.PageConfig|undefined),
 *    handler: (function(new: relief.nav.Handler,
 *                       !relief.nav.NavServiceProvider)|undefined|null)}}
 */
relief.nav.Path;
