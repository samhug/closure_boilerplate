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
 * Provides a simple handler class that simply displays a message on the
 * screen.
 */

goog.provide('relief.handlers.MessageHandler');

goog.require('relief.nav.Handler');



/**
 * Simple handler implementation that displays a message.  A
 * relief.handlers.MessageProvider.PageConfig object MUST be provided, or an
 * error will be thrown.
 *
 * @param {relief.handlers.CommonServiceProvider} sp The ServiceProvider for
 *    the app.
 *
 * @constructor
 * @implements {relief.nav.Handler}
 */
relief.handlers.MessageHandler = function(sp) {
  /**
   * @type {Element}
   * @private
   */
  this.content_ = sp.getContentRoot();
};


/**
 * The MessageHandler class expects a PageConfig object with a "message"
 * property.  This property must be either a string, or an object that has both
 * a "templateParams" property and a "template" property.
 *
 * @typedef {{
 *   message: (string|{templateParams: Object, template: function(Object)})
 * }}
 */
relief.handlers.MessageHandler.PageConfig;


/**
 * Display the message provided in the PageConfig object.
 * @override
 */
relief.handlers.MessageHandler.prototype.handle = function(path) {
  var config = /** @type {relief.handlers.MessageHandler.PageConfig} */
      (path.pageConfig);

  if (!config) {
    throw Error('No PageConfig object provided to handler for path: ' +
                path.path);
  }

  var message = config.message;
  if (goog.isString(message)) {
    this.content_.innerHTML = message;
  }
  else if (goog.isObject(message)) {
    this.content_.innerHTML = message.template(message.templateParams);
  }
};


/**
 * @override
 */
relief.handlers.MessageHandler.prototype.transition =
    function(path, onTransition) {

  this.handle(path);
  onTransition(true);
};


/**
 * @override
 */
relief.handlers.MessageHandler.prototype.exit = function(onExit, opt_force) {
  this.content_.innerHTML = '';
  onExit(true);
};


/**
 * @override
 */
relief.handlers.MessageHandler.prototype.dispose = function() {
  this.content_ = null;
};


/**
 * @override
 */
relief.handlers.MessageHandler.prototype.isDisposed = function() {
  return this.content_ === null;
};
