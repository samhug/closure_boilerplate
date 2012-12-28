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
 * Provides miscellaneous utility functions relating to loading CSS files,
 * handling window.location in a mockable way, and eventually more as the
 * project grows.
 */

goog.provide('relief.utils');

goog.require('goog.array');
goog.require('goog.dom');


/**
 * Install a stylesheet.
 * @param {string} stylesheet The name of the stylesheet.
 * @param {boolean=} opt_cacheBreaker Append timestamp to prevent using a
 *    cached version.
 */
relief.utils.installCSS = function(stylesheet, opt_cacheBreaker) {
  // Make sure it's not already loaded.
  var loaded = relief.utils.installCSS.loadedCSS_;

  if (goog.array.indexOf(loaded, stylesheet) === -1) {
    var head = goog.dom.getElementsByTagNameAndClass('head')[0],
        cacheBreak = ((! COMPILED) || opt_cacheBreaker) ?
            ('?' + goog.now()) : '',
        props = {
          'rel': 'stylesheet',
          'href': '/stylesheets/' + stylesheet + '.css' + cacheBreak
        },
        newCSS = goog.dom.createDom('link', props);
    head.appendChild(newCSS);
    relief.utils.installCSS.loadedCSS_.push(stylesheet);
  }
};


/**
 * @return {string} The current window.location.href.
 */
relief.utils.getLocationHref = function() {
  return window.location.href;
};


/**
 * Set window.location.href to a new URL.
 * @param {string} href The new location.
 */
relief.utils.setLocationHref = function(href) {
  window.location.href = href;
};


/**
 * @return {string} The current window.location.hash.
 */
relief.utils.getLocationHash = function() {
  return window.location.hash;
};


/**
 * Set the window location's hash.
 * @param {string} hash The new hash location.
 */
relief.utils.setLocationHash = function(hash) {
  window.location.hash = hash;
};


/**
 * A list of all currently loaded stylesheets
 * @type {Array.<string>}
 * @private
 */
relief.utils.installCSS.loadedCSS_ = [];
