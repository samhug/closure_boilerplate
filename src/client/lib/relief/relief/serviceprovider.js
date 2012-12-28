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
 * Provides the base, default implementation for a Relief service provider.
 * This is the base class for NavServiceProvider, which is a required
 * dependency of the {@link relief.nav.NavManager} class.  Most commonly,
 * user code will want to extend {@link relief.handlers.CommonServiceProvider}
 * instead of {@code relief.ServiceProvider}.
 */
goog.provide('relief.ServiceProvider');

goog.require('goog.Disposable');
goog.require('goog.dispose');



/**
 * The service provider class is the enabler for dependency injection.  It
 * provides a mechanism for injecting arbitrary objects and values into other
 * systems at construction.  If a subsystem requires specific things be
 * injected into them, developers are encouraged to subclass ServiceProvider
 * with one that requires the needed subsystems as constructor arguments.
 * See relief.sp.NavServiceProvider for an example.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
relief.ServiceProvider = function() {
  goog.base(this);

  /**
   * @type {Object.<*>}
   * @private
   */
  this.resources_ = {};
};
goog.inherits(relief.ServiceProvider, goog.Disposable);


/**
 * This method (and the corresponding getter) allow for injecting arbitrary
 * values via the ServiceProvider object.  If something was already inserted
 * with the same name, the existing value is passed to goog.dispose() and then
 * overwritten with the new value.
 *
 * @param {string} name The name of the resource to store.
 * @param {*} value The thing to store.
 */
relief.ServiceProvider.prototype.setResource = function(name, value) {
  var resources = this.resources_;

  if (resources[name]) {
    // Dispose the existing value.
    goog.dispose(resources[name]);
  }

  resources[name] = value;
};


/**
 * @param {string} name The name of the resource to get.
 * @return {*} Returns the requested object.
 */
relief.ServiceProvider.prototype.getResource = function(name) {
  return this.resources_[name];
};


/**
 * @override
*/
relief.ServiceProvider.prototype.disposeInternal = function() {
  var resources = this.resources_;

  for (var key in resources) {
    goog.dispose(resources[key]);
    delete resources[key];
  }
};


/**
 * Throws an error if called after disposal.  This way, subclasses can assert
 * that the provider has not yet been disposed, and if no error is thrown, the
 * resource can safely be cast to non-null and returned.
 *
 * @protected
 */
relief.ServiceProvider.prototype.assertNotDisposed = function() {
  if (this.isDisposed()) {
    throw Error('Attempting to retrieve resource after disposal.');
  }
};
