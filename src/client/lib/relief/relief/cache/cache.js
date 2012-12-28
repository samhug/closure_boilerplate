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
 * Cache manages the storage of objects in memory.
 *
 * BY REFERENCE VS. BY VALUE
 * Values can be stored in the cache in one of two modes:  by reference or
 * by value (primitive types are obviously always passed by value).  When an
 * object is stored in the cache by reference, that a reference to that object
 * will be returned to the client when retrieved.
 *
 * When an object is stored by value, a clone of the object will be stored in
 * the cache instead of a reference to the original object.  When the value is
 * retrieved, it will again be cloned and a reference to that clone will be
 * returned.  This ensures that no one has the ability to modify the value
 * in the cache except by overwriting it.
 *
 * Storing objects by reference has the benefit of a lower memory footprint and
 * faster performance by not needing to clone the object on get and set calls.
 * Users of store-by-reference objects need to be careful about modifying cached
 * objects, as they may not be the only ones using that object.  This is, of
 * course, the benefit of storing objects by value:  you are assured that no one
 * can modify the value in the cache at the cost of additional overhead in
 * object allocation/cloning and extra storage.
 *
 * The familiar set methods all perform storage and retrieval by reference.
 * Use setByValue to store by value, and to tell the cache that future gets
 * should be by value as well.
 *
 * NAMESPACING
 * The cache can be namespaced so that you do not have to worry about over-
 * writing other cache clients' values when you use common keys.  This is used
 * extensively in the RPC service.  This is implemented by pre-pending the
 * namespace prefix onto the key when the object is stored in the cache.  Having
 * completely separate cache maps was considered, but the overhead of allocating
 * a potentially large number of different caches did not outweigh the edge
 * case where the a non-namespaced cache key might clash with a namespaced one.
 */

goog.provide('relief.cache.Cache');

goog.require('goog.math');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.structs.LinkedMap');
goog.require('goog.structs.Map');

goog.require('relief.cache.Cloneable');
goog.require('relief.cache.SimpleValue');



/**
 * Provides caching infrastructure for your application.  There is no limit
 * to the number of caches an app can have, but given the possibility of
 * namespacing inserted values, it is more efficient and only marginally less
 * safe to create one global cache and pass it around via dependency injection.
 * The one place where it might be wise to have more than one cache for an app
 * is if you want to cache as many of your RPC responses as possible but limit
 * the size of your general cache.
 *
 * @param {number=} opt_maxSize Only used when limitCacheSize is set to true.
 *
 * @constructor
 */
relief.cache.Cache = function(opt_maxSize) {
  // If the user wants a size-limited cache, use a LinkedMap since it already
  // implements that behavior.  If not, use a regular Map to avoid the overhead.

  var map;
  if (opt_maxSize && opt_maxSize > 0) {
    map = new goog.structs.LinkedMap(opt_maxSize, true);
  }
  else {
    map = new goog.structs.Map();
  }

  /**
   * @type {goog.structs.Map|goog.structs.LinkedMap}
   * @private
   */
  this.map_ = map;

  /**
   * Store a list of keys that are stored by value.
   * @type {Object.<string, boolean>}
   * @private
   */
  this.byValueKeys_ = {};
};


/**
 * The various set() methods can be flagged to store values only under certain
 * circumstances.
 *
 * @enum {number}
 */
relief.cache.Cache.SetPolicy = {
  /**
   * Always set a value.
   */
  ALWAYS_SET: 0,

  /**
   * Only set if the key is not already in the map.
   */
  SET_ONLY_IF_NOT_PRESENT: 1,

  /**
   * Only set the value if the key is already in the map.
   */
  SET_ONLY_IF_PRESENT: 2
};


/**
 * When a cache value is set to this constant, the cache's set methods will instead recognize the
 * key/value as being invalidated and will instead remove the key from the cache.  This feature
 * makes it easier for second-hand clients of the cache (who don't have direct access) to trigger
 * cache expiration.
 *
 * An example of this is a Command object passing cache values to the RPC
 * Service.  Commands don't have a reference to the cache, so they need some other way to trigger
 * invalidation.
 *
 * @type {string}
 */
relief.cache.Cache.EXPIRED = '__cache__:EXPIRED';


/**
 * useNamespace returns an object that effectively subclasses this instance of
 * the cache.  The non-namespaced cache methods are shadowed on this object
 * and delegate to the namespaced versions of those methods.  Clients can test
 * whether or not the cache object they have in hand is a plain cache or a
 * namespaced cache by checking for the existence and/or contents of the
 * namespace attribute.
 *
 * @param {string} ns The namespace to bind to the returned object.
 * @return {!relief.cache.Cache} The cache mirror for the namespace.
 */
relief.cache.Cache.prototype.useNamespace = function(ns) {
  /** @constructor */
  var temp = function() {};
  temp.prototype = this;

  var cache = new temp();
  cache.get = goog.bind(this.nsGet, this, ns);
  cache.set = goog.bind(this.nsSet, this, ns);

  // Shadow the non-namespaced methods with ones that have the namespace
  // curried onto the namespaced version.
  cache.remove = goog.bind(this.nsRemove, this, ns);
  cache.containsKey = goog.bind(this.nsContainsKey, this, ns);
  cache.containsValue = goog.bind(this.nsContainsValue, this, ns);
  cache.setByValue = goog.bind(this.nsSetByValue, this, ns);
  cache.increment = goog.bind(this.nsIncrement, this, ns);

  // Read-only property.  Client code should not modify this, as it will have
  // no affect - the namespace passed into the method is hard-wired into the
  // returned mirror.  This is only present for convenience.
  cache.namespace = ns;

  return /** @type {!relief.cache.Cache} */ (cache);
};


/**
 * Forms a properly namespaced key.
 * @param {string} ns The namespace.
 * @param {string} key The key.
 *
 * @return {string} The namespaced key.
 * @private
 */
relief.cache.Cache.prototype.getNamespacedKey_ = function(ns, key) {
  return '__' + ns + '__:' + key;
};


/**
 * Gets a value for the given key.  If it was set by value, get() will return
 * a clone of the cached value.
 *
 * @param {string} key The key to look up.
 * @param {*=} opt_value The value to return if the key is not in the cache.
 *    This value is NOT stored in the event of a cache miss.
 *
 * @return {*} The cached value or undefined if the key was never stored.
 */
relief.cache.Cache.prototype.get = function(key, opt_value) {
  var value = this.map_.get(key, opt_value);
  if (this.byValueKeys_[key]) {
    value = relief.cache.Cache.clone_(value);
  }
  return value;
};


/**
 * Gets a value for the given key in the given namespace.  If it was set by
 * value, nsGet() will return a clone of the cached value.
 *
 * @param {string} ns The namespace to look in.
 * @param {string} key The key to look up.
 * @param {*=} opt_value The value to return if the key is not in the cache.
 *    This value is NOT stored in the event of a cache miss.
 *
 * @return {*} The cached value or undefined if the key was never stored.
 */
relief.cache.Cache.prototype.nsGet = function(ns, key, opt_value) {
  var nsKey = this.getNamespacedKey_(ns, key),
      value = this.map_.get(nsKey, opt_value);
  if (this.byValueKeys_[nsKey]) {
    value = relief.cache.Cache.clone_(value);
  }
  return value;
};


/**
 * Stores a value for the given key by reference in the map.  If the value is equal to
 * relief.cache.Cache.EXPIRED.
 *
 * @param {string} key The key to store.
 * @param {*} value The value to store.
 * @param {relief.cache.Cache.SetPolicy=} opt_setPolicy Different flags for
 *    triggering certain behaviors.  Defaults to ALWAYS_SET.
 *
 * @return {boolean} Whether the value was set.  If value === EXPIRED, returns true to indicate the
 *    key was removed from the cache.
 */
relief.cache.Cache.prototype.set = function(key, value, opt_setPolicy) {
  var map = this.map_,
      keyPresent = map.containsKey(key),
      setPolicy = opt_setPolicy || relief.cache.Cache.SetPolicy.ALWAYS_SET;

  if (value === relief.cache.Cache.EXPIRED && keyPresent) {
    delete this.byValueKeys_[key];
    return this.map_.remove(key);
    
  }

  if (! setPolicy /* setPolicy === ALWAYS_SET or setPolicy === undefined */ ||
      (setPolicy === relief.cache.Cache.SetPolicy.SET_ONLY_IF_NOT_PRESENT &&
          !keyPresent) ||
      (setPolicy === relief.cache.Cache.SetPolicy.SET_ONLY_IF_PRESENT &&
          keyPresent)) {
    this.map_.set(key, value);
    delete this.byValueKeys_[key];
    return true;
  }

  return false;
};


/**
 * Stores a value for the given key by reference in the map under the given
 * namespace.
 *
 * @param {string} ns The namespace to look in.
 * @param {string} key The key to look up.
 * @param {*=} opt_value The value to return if the key is not in the cache.
 * @param {relief.cache.Cache.SetPolicy=} opt_setPolicy Different flags for
 *    triggering certain behaviors.  Defaults to ALWAYS_SET.
 *
 * @return {boolean} Whether the value was set.
 */
relief.cache.Cache.prototype.nsSet =
    function(ns, key, opt_value, opt_setPolicy) {

  return this.set(this.getNamespacedKey_(ns, key), opt_value, opt_setPolicy);
};


/**
 * Stores a clone of the given value in the cache.  Since primitives are always
 * passed by value, this is only really useful for objects and arrays.
 * In addition, functions will not be cloned.
 *
 * @param {string} key The key of the value to cache.
 * @param {relief.cache.Cloneable|relief.cache.SimpleValue} value The value
 *    to clone and put in cache.
 * @param {relief.cache.Cache.SetPolicy=} opt_setPolicy Different flags for
 *    triggering certain behaviors.  Defaults to ALWAYS_SET.
 *
 * @return {boolean} Whether the value was set.
 */
relief.cache.Cache.prototype.setByValue = function(key, value, opt_setPolicy) {
  var wasSet = this.set(key, relief.cache.Cache.clone_(value), opt_setPolicy);
  if (wasSet) {
    this.byValueKeys_[key] = true;
  }
  return wasSet;
};


/**
 * Stores a clone of the given value in the cache namespace.  Since primitives
 * are always passed by value, this is only really useful for objects and
 * arrays.  In addition, functions will not be cloned.
 *
 * @param {string} ns The namespace.
 * @param {string} key The key of the value to cache.
 * @param {relief.cache.Cloneable|relief.cache.SimpleValue} value The value to
 *    to clone and put in cache.
 * @param {relief.cache.Cache.SetPolicy=} opt_setPolicy Different flags for
 *    triggering certain behaviors.  Defaults to ALWAYS_SET.
 *
 * @return {boolean} Whether the value was set.
 */
relief.cache.Cache.prototype.nsSetByValue =
    function(ns, key, value, opt_setPolicy) {

  var nsKey = this.getNamespacedKey_(ns, key),
      clone = relief.cache.Cache.clone_(value),
      wasSet = this.nsSet(ns, key, clone, opt_setPolicy);

  if (wasSet) {
    this.byValueKeys_[nsKey] = true;
  }
  return wasSet;
};


/**
 * Deletes the given key from the cache.
 *
 * @param {string} key The key to delete.
 * @return {boolean} Whether or not something was removed.
 */
relief.cache.Cache.prototype.remove = function(key) {
  delete this.byValueKeys_[key];
  return this.map_.remove(key);
};


/**
 * Deletes the given key from the given namespace in the cache.
 *
 * @param {string} ns The namespace.
 * @param {string} key The key to delete.
 * @return {boolean} Whether or not something was removed.
 */
relief.cache.Cache.prototype.nsRemove = function(ns, key) {
  var nsKey = this.getNamespacedKey_(ns, key);
  delete this.byValueKeys_[nsKey];
  return this.map_.remove(nsKey);
};


/**
 * Checks whether the given key is in the cache.
 *
 * @param {string} key The key to check for.
 * @return {boolean} Whether the key is in the map.
 */
relief.cache.Cache.prototype.containsKey = function(key) {
  return this.map_.containsKey(key);
};


/**
 * Checks whether the given key is in the cache namespace.
 *
 * @param {string} ns The namespace.
 * @param {string} key The key to check for.
 * @return {boolean} Whether the namespaced key is in the map.
 */
relief.cache.Cache.prototype.nsContainsKey = function(ns, key) {
  return this.map_.containsKey(this.getNamespacedKey_(ns, key));
};


/**
 * Checks whether the given value is in the cache.  Will only return true if
 * the value's key is not namespaced.
 *
 * @param {*} val The value to search for.
 * @return {boolean} Whether the value was found in the global namespace.
 */
relief.cache.Cache.prototype.containsValue = function(val) {
  var map = this.map_,
      keys = map.getKeys(),
      re = /^__.*__\:/;

  for (var i = 0, len = keys.length; i < len; ++i) {
    var key = keys[i],
        mappedVal = map.get(key);

    // Only return true of the key is NOT namespaced
    if (mappedVal === val && (! re.test(key))) {
      return true;
    }
  }

  return false;
};


/**
 * Checks whether the given value is in the given namespace.
 *
 * @param {string} ns The namespace to look in.
 * @param {*} val The value to search for.
 * @return {boolean} Whether the value was found in the given namespace.
 */
relief.cache.Cache.prototype.nsContainsValue = function(ns, val) {
  var keyPrefix = this.getNamespacedKey_(ns, ''),
      map = this.map_,
      keys = map.getKeys();

  for (var i = 0, len = keys.length; i < len; ++i) {
    var key = keys[i];
    if (goog.string.startsWith(key, keyPrefix)) {
      if (map.get(key) === val) {
        return true;
      }
    }
  }

  return false;
};


/**
 * Increments (positive delta) or decrements (negative delta) the value in the
 * cache by the given delta.  Will attempt to parseInt the cached value if it
 * is not a number.  Attempting to increment a value that cannot be coerced
 * into an integer will throw an error.
 *
 * Note: If the value in the cache is not an integer, it will be floored before
 * applying the delta.  For example:
 *   cache.set('key', 5.5);
 *   cache.increment('key', 1) // Sets value to and returns 6.
 *
 * Note: If the value is a string, it will be coerced to an integer,
 * incremented, and then stored back in the cache as a number.
 *
 * Client may provide an optional integer value to be returned in the key
 * is not already stored in the cache.  If the value is missing, initialValue
 * will be returned untouched (it will not be incremented and then returned).
 *
 * To facilitate use as a zero-floored counter, the default behavior when
 * decrementing will be to return zero, instead of decrementing to a negative
 * value.  In order to turn this behavior off, the user can set
 * decrementBelowZero to true.  This will allow the counter to be set at
 * whatever value the arithmetic dictates.  Note, if a value is already
 * negative, it will be decremented further negative.
 *
 * @param {string} key The key to increment/decrement.
 * @param {number=} opt_delta The integer to be added or subtracted.
 *    Defaults to 1.
 * @param {number=} opt_initialValue The value to set and return if the key is
 *    not in the cache.  Defaults to 0.
 * @param {boolean=} opt_decrementBelowZero Whether or not to allow decrement
 *    operations to take a number from positive to negative.
 *
 * @return {?number} The incremented value or null if the key was not set
 *    and no initial value was provided.
 */
relief.cache.Cache.prototype.increment =
    function(key, opt_delta, opt_initialValue, opt_decrementBelowZero) {

  var map = this.map_,
      val = map.get(key),
      delta = goog.isDef(opt_delta) ? opt_delta : 1,
      decrementBelowZero = opt_decrementBelowZero || false;


  // Value can be anything, at this point:
  // - Undefined (missing from cache) => Set initialValue, otherwise throw
  // - Integer // increment
  // - Float // floor, then increment
  // - String // coerce; then increment if possible, otherwise throw
  // - Incompatible value (boolean, object, null, present but undefined)

  if (! goog.isDef(val)) {
    // Cache value is undefined.  Was it explicitly set to be undefined,
    // or is it undefined because it was missing?

    if (! map.containsKey(key)) {
      // Key was never stored in the cache.
      if (goog.isDef(opt_initialValue)) {
        if (! goog.math.isInt(opt_initialValue)) {
          throw Error('Initial value for increment is not an integer.');
        }

        this.set(key, opt_initialValue);
        return opt_initialValue;
      }
      else {
        // Key was never stored in the cache and no initial value was provided
        return null;
      }
    }
  }

  if (goog.isString(val)) {
    // Cached value was a string.
    var coercedVal = parseInt(val, 10);
    if (isNaN(coercedVal)) {
      throw Error('Attempting to increment a non-numeric cache value: ' + val);
    }

    val = coercedVal;
  }

  if (goog.isNumber(val)) {
    if (! goog.math.isInt(delta)) {
      throw Error('Attempting to increment by a non-integer value: ' + delta);
    }

    val = Math.floor(val);
    var newVal = (decrementBelowZero || (val < 0)) ?
                     (val + delta) : (Math.max(0, val + delta));

    this.set(key, newVal);
    return newVal;
  }

  throw Error('Attempting to increment a non-numeric value: ' + val);
};


/**
 * Increments or decrements a namespaced key/value.  See #increment for details.
 *
 * @param {string} ns The namespace.
 * @param {string} key The key to increment/decrement.
 * @param {number=} opt_delta The integer to be added or subtracted.
 *    Defaults to 1.
 * @param {number=} opt_initialValue The value to set and return if the key is
 *    not in the cache.  Defaults to 0.
 * @param {boolean=} opt_decrementBelowZero Whether or not to allow decrement
 *    operations to take a number from positive to negative.
 * @return {?number} The incremented value or null if the key was not set
 *    and no initial value was provided.
 */
relief.cache.Cache.prototype.nsIncrement =
    function(ns, key, opt_delta, opt_initialValue, opt_decrementBelowZero) {

  return this.increment(this.getNamespacedKey_(ns, key), opt_delta,
                        opt_initialValue, opt_decrementBelowZero);
};


/**
 * Clones a value.
 *
 * This method wraps goog.object.unsafeClone as a way to force inputs to be
 * of types that are safe to clone.  Values must be either a JS primitive value,
 * a relief.cache.Cloneable, or a relief.cache.SimpleValue.  See the JSDoc
 * for these interfaces to learn more about which to use when.
 *
 * @param {relief.cache.Cloneable|relief.cache.SimpleValue|number|string|
 *    boolean|null|undefined} obj The value to clone.
 * @return {*} A clone of the input value.
 *
 * @private
 */
relief.cache.Cache.clone_ = function(obj) {
  return goog.object.unsafeClone(obj);
};
