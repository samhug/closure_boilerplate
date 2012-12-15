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
 * Unit tests for the relief.cache.Cache class.
 */

goog.require('goog.structs.LinkedMap');
goog.require('goog.structs.Map');

goog.require('relief.cache.Cache');
goog.require('relief.testing.stubFn');



var stubFn,
    cloneObject,
    $ = window;

function setUpPage() {
  cloneObject = relief.cache.Cache.clone_;
  stubFn = relief.testing.stubFn;
}


/*
The cache global variable and setUp methods are defined in the host page so
that there can be one cache_test.js and the host page can decide which version
to instantiate. (map_cache_test.html and linkedmap_cache_test.html)

var cache;
function setUp() {
  cache = new relief.cache.Cache();
}
*/


/**
 * Tests that creating a new cache without limiting the size uses a
 * goog.structs.Map.
 */
$['test Constructor without size limit uses Map'] = function() {
  cache = new relief.cache.Cache();
  assertTrue('Cache did not use a Map when called with no size limit.',
             cache.map_ instanceof goog.structs.Map);
};


/**
 * Tests that creating a new cache with a size limit uses a
 * goog.structs.LinkedMap.
 */
$['test Constructor with size limit uses LinkedMap'] = function() {
  cache = new relief.cache.Cache(true, 5);
  assertTrue('Cache did not use a LinkedMap when called with a size limit.',
             cache.map_ instanceof goog.structs.LinkedMap);
};


/**
 * Tests getNamespacedKey that a properly namespaced key is returned.
 */
$['test getNamespacedKey returns a properly namespaced key'] = function() {
  var ns = 'test',
      key = 'DogName',
      expectedKey = '__' + ns + '__:' + key,
      actualKey = relief.cache.Cache.prototype.getNamespacedKey_(ns, key);

  assertEquals('getNamespacedKey did not return a properly namespaced key.',
               expectedKey, actualKey);
};


/**
 * Tests that get() calls this.map_.get correctly.
 */
$['test get() method calls map_.get correctly'] = function() {
  var get = cache.map_.get = stubFn();

  var val = cache.get('dog', 25);
  assertEquals('Cache.get did not call map_.get with proper key.',
               'dog', get.args[0]);
  assertEquals('Cache.get did not call map_.get with proper default value.',
               25, get.args[1]);
};


/**
 * Test that nsGet calls this.map_.get correctly.
 */
$['test nsGet() method calls map_.get correctly'] = function() {
  var ns = 'test',
      key = 'DogName',
      expectedKey = '__' + ns + '__:' + key,
      getKey = cache.getNamespacedKey_ = stubFn(expectedKey),
      get = cache.map_.get = stubFn();

  var val = cache.nsGet(ns, key, 25);
  assertEquals('Cache.nsGet did not call getNamespacedKey correctly.',
               ns, getKey.args[0]);
  assertEquals('Cache.nsGet did not call getNamespacedKey correctly.',
               key, getKey.args[1]);

  assertEquals('Cache.get did not call map_.get with proper key.',
               expectedKey, get.args[0]);
  assertEquals('Cache.get did not call map_.get with proper default value.',
               25, get.args[1]);
};


/**
 * Tests that set() calls this.map_.set correctly.
 */
$['test set() method calls map_.set correctly'] = function() {
  var set = cache.map_.set = stubFn();

  cache.set('dog', 25);
  assertEquals('Cache.set did not call map_.set with proper key.',
               'dog', set.args[0]);
  assertEquals('Cache.set did not call map_.set with proper default value.',
               25, set.args[1]);
};


/**
 * Tests that calling set() with a value of relief.cache.Cache.EXPIRED removes
 * the key from the map.
 */
$['test set() removes key if value === EXPIRED'] = function() {
  var remove = cache.map_.remove = stubFn(),
      key = 'dog';
  
  cache.map_.set(key, 'cat');
  
  cache.set(key, relief.cache.Cache.EXPIRED);
  assertEquals('Cache.set(value=EXPIRED) did not call map_.remove with key.',
               key, remove.args[0]);
};


/**
 * Test that nsSet calls set correctly.
 */
$['test nsSet() method calls set correctly'] = function() {
  var ns = 'test',
      key = 'DogName',
      expectedKey = '__' + ns + '__:' + key,
      getKey = cache.getNamespacedKey_ = stubFn(expectedKey),
      set = cache.set = stubFn();

  cache.nsSet(ns, key, 25);
  assertEquals('nsSet did not call getNamespacedKey correctly.',
               ns, getKey.args[0]);
  assertEquals('nsSet did not call getNamespacedKey correctly.',
               key, getKey.args[1]);

  assertEquals('nsSet did not call set with proper key.',
               expectedKey, set.args[0]);
  assertEquals('Cache.get did not call map_.set with proper default value.',
               25, set.args[1]);
};


/**
 * Test that set() clears the key from byValueKeys_ if present.
 */
$['test set() method clears key from byValueKeys'] = function() {
  var key = 'Houdini',
      byValueKeys = cache.byValueKeys_;

  byValueKeys[key] = true;
  cache.set(key, '*vanish*');
  assertUndefined('Key was not removed from byValueKeys.',
                  byValueKeys[key]);
};


/**
 * Test that nsSet() clears the key from byValueKeys_ if present.
 */
$['test nsSet() method clears key from byValueKeys'] = function() {
  var ns = 'magicians',
      key = 'Houdini',
      nsKey = '__' + ns + '__:' + key,
      byValueKeys = cache.byValueKeys_;

  byValueKeys[nsKey] = true;
  cache.nsSet(ns, key, '*vanish*');
  assertUndefined('Key was not removed from byValueKeys.',
                  byValueKeys[nsKey]);
};

/*
 * Test the cross-product of:
 * Flags:
 *    ALWAYS_SET
 *    SET_ONLY_IF_NOT_PRESENT
 *    SET_ONLY_IF_PRESENT
 *
 * and states:
 *    Not Present: Key is not in the map.
 *    Present: Key is in the map
 *
 * ALWAYS_SET + Not Present => Set
 * ALWAYS_SET + Present => Set
 *
 * SET_ONLY_IF_NOT_PRESENT + Not Present => Set
 * SET_ONLY_IF_NOT_PRESENT + Present => Do not set
 *
 * SET_ONLY_IF_PRESENT + Not Present => Do not set
 * SET_ONLY_IF_PRESENT + Present => Set
 */


/**
 * Test that not specifying a SetPolicy defaults to ALWAYS_ON in both states.
 */
$['test set(setPolicy=undefined) defaults to ALWAYS_SET'] = function() {
  var key = 'test',
      valueA = 'valueA',
      valueB = 'valueB';

  cache.set(key, valueA);
  assertEquals('Cache did not set the value.', valueA, cache.get(key));

  cache.set(key, valueB);
  assertEquals('Cache did not set the value.', valueB, cache.get(key));
};


/**
 * Test that set(SetPolicy.ALWAYS_SET) always sets the value.
 */
$['test set(SetPolicy.ALWAYS_SET)'] = function() {
  var key = 'test',
      valueA = 'valueA',
      valueB = 'valueB',
      SetPolicy = relief.cache.Cache.SetPolicy;

  // Test state = key not present
  var ret = cache.set(key, valueA, SetPolicy.ALWAYS_ON);
  assertEquals('Cache did not set the value.', valueA, cache.get(key));
  assertTrue('set should have returned true.', ret);

  // Test state = key is present
  ret = cache.set(key, valueB, SetPolicy.ALWAYS_ON);
  assertEquals('Cache did not set the value.', valueB, cache.get(key));
  assertTrue('set should have returned true.', ret);
};


/**
 * Test that set(SetPolicy.SET_ONLY_IF_NOT_PRESENT) sets the value only when
 * the key is not in the map.
 */
$['test set(SetPolicy.SET_ONLY_IF_NOT_PRESENT)'] = function() {
  var key = 'test',
      valueA = 'valueA',
      valueB = 'valueB',
      SetPolicy = relief.cache.Cache.SetPolicy;

  // Test state = key not present
  var ret = cache.set(key, valueA, SetPolicy.SET_ONLY_IF_NOT_PRESENT);
  assertEquals('Cache did not set the value.', valueA, cache.get(key));
  assertTrue('set should have returned true.', ret);

  // Test state = key is present
  ret = cache.set(key, valueB, SetPolicy.SET_ONLY_IF_NOT_PRESENT);
  assertEquals('Cache should not have set the value.', valueA, cache.get(key));
  assertFalse('set should have returned false.', ret);
};


/**
 * Test that set(SetPolicy.SET_ONLY_IF_PRESENT) sets the value only when
 * the key is not in the map.
 */
$['test set(SetPolicy.SET_ONLY_IF_PRESENT)'] = function() {
  var key = 'test',
      valueA = 'valueA',
      valueB = 'valueB',
      SetPolicy = relief.cache.Cache.SetPolicy;

  // Test state = key not present
  var ret = cache.set(key, valueA, SetPolicy.SET_ONLY_IF_PRESENT);
  assertUndefined('Cache should not have set the value.', cache.get(key));
  assertFalse('set should have returned false.', ret);

  // Put a value in for the key.
  cache.set(key, valueA);

  // Test state = key is present
  ret = cache.set(key, valueB, SetPolicy.SET_ONLY_IF_PRESENT);
  assertEquals('Cache should have set the value.', valueB, cache.get(key));
  assertTrue('set should have returned true.', ret);
};


/**
 * Test that setByValue calls set() with a clone of the given value.
 */
$['test setByValue calls set() with a clone of the value'] = function() {
  var key = 'answer',
      val = {
        'answers': {
          'life': 42,
          'theUniverse': 42,
          'everything': 42
        }
      },
      set = cache.set = stubFn();

  cache.setByValue(key, val);
  assertEquals('setByValue called set with an incorrect key.',
               key, set.args[0]);
  assertNotEquals('setByValue called set with the same object.',
                  val, set.args[1]);
  assertObjectEquals('setByValue called set with an invalid clone.',
                     val, set.args[1]);
};


/**
 * Test that setByValue properly the value's key in the byValue map.
 */
$['test setByValue adds key to the byValue map'] = function() {
  var key = 'key',
      value = 'lock',
      byValueKeys = cache.byValueKeys_;

  assertUndefined('byValueKeys map should be empty to start.',
                  byValueKeys[key]);

  cache.setByValue(key, value);
  assertNotUndefined('byValueKeys should contain the given key.',
                     byValueKeys[key]);
};


/**
 * Test that nsSetByValue calls nsSet with a clone of the value.
 */
$['test nsSetByValue stores a clone of the value'] = function() {
  var ns = 'wisdom',
      key = 'answer',
      val = {
        'answers': {
          'life': 42,
          'theUniverse': 42,
          'everything': 42
        }
      },
      set = cache.nsSet = stubFn();

  cache.nsSetByValue(ns, key, val);
  assertEquals('nsSetByValue called set with an incorrect key.',
               key, set.args[1]);
  assertNotEquals('setByValue called set with the same object.',
                  val, set.args[2]);
  assertObjectEquals('setByValue called set with an invalid clone.',
                     val, set.args[2]);
};


/**
 * Test that get returns a clone of byValue values.
 */
$['test get returns clone of byValue values'] = function() {
  var key = 'man',
      value = {
        'name': 'Doug Kinney'
      };

  cache.setByValue(key, value);
  var clone = cache.get(key),
      mapValue = cache.map_.get(key);
  assertNotEquals('The gotten value should not be the one in the cache.',
                  mapValue, clone);
  assertObjectEquals('Get has returned an invalid clone.',
                     mapValue, clone);
};


/**
 * Test that nsGet returns a clone of byValue values.
 */
$['test nsGet returns clone of byValue values'] = function() {
  var ns = 'characters',
      key = 'man',
      value = {
        'name': 'Doug Kinney'
      };

  cache.nsSetByValue(ns, key, value);
  var clone = cache.nsGet(ns, key),
      mapValue = cache.map_.get('__' + ns + '__:' + key);
  assertNotEquals('The gotten value should not be the one in the cache.',
                  mapValue, clone);
  assertObjectEquals('Get has returned an invalid clone.',
                     mapValue, clone);
};


/**
 * Test remove calls.
 */
$['test remove() method calls map_.remove correctly'] = function() {
  var map = cache.map_.remove = stubFn();

  cache.remove('key');
  assertEquals('Cache.delete should have passed the key to map.remove.',
               'key', map.args[0]);
};


/**
 * Test namespaced remove calls.
 */
$['test nsRemove() method calls map_.remove correctly'] = function() {
  var remove = cache.map_.remove = stubFn();

  cache.nsRemove('ns', 'key');
  assertEquals('Cache.delete should have passed the key to map.remove.',
               '__ns__:key', remove.args[0]);
};


/**
 * Test that remove() clears the key from byValueKeys_ if present.
 */
$['test remove() method clears key from byValueKeys'] = function() {
  var key = 'Houdini',
      byValueKeys = cache.byValueKeys_;

  byValueKeys[key] = true;
  cache.remove(key);
  assertUndefined('Key was not removed from byValueKeys.', byValueKeys[key]);
};


/**
 * Test that nsRemove() clears the key from byValueKeys_ if present.
 */
$['test nsRemove() method clears key from byValueKeys'] = function() {
  var ns = 'magicians',
      key = 'Houdini',
      nsKey = '__' + ns + '__:' + key,
      byValueKeys = cache.byValueKeys_;

  byValueKeys[nsKey] = true;
  cache.nsRemove(ns, key);
  assertUndefined('Key was not removed from byValueKeys.',
                  byValueKeys[nsKey]);
};


/**
 * Test containsKey.
 */
$['test containsKey() method calls map_.containsKey correctly'] = function() {
  var containsKey = cache.map_.containsKey = stubFn();

  cache.containsKey('moo');
  assertEquals('Cache.containsKey should have passed key to map_.containsKey.',
               'moo', containsKey.args[0]);
};


/**
 * Test namespaced containsKey.
 */
$['test nsContainsKey() method calls map_.containsKey correctly'] = function() {
  var containsKey = cache.map_.containsKey = stubFn();

  cache.nsContainsKey('cow', 'moo');
  assertEquals('Cache.containsKey should have passed the namespaced key to ' +
               'map_.containsKey.',
               '__cow__:moo', containsKey.args[0]);
};


/**
 * Test that containsValue correctly determines if an entity is in the cache.
 */
$['test containsValue correctly determines presence in cache'] = function() {
  var key = 'dog',
      value = 'labrador';

  cache.set(key, value);
  var contains = cache.containsValue(value);
  assertTrue('containsValue should have returned true.', contains);

  contains = cache.containsValue('missing');
  assertFalse('containsValue should have returned false.', contains);
};


/**
 * Test that containsValue returns false if a value is in the cache under a
 * namespaced key.
 */
$['test containsValue returns false for namespaced value'] = function() {
  var ns = 'my',
      key = 'cat',
      value = 'rocks';

  cache.nsSet(ns, key, value);
  var contains = cache.containsValue(value);
  assertFalse('containsValue should have returned false.', contains);
};


/**
 * Test that nsContainsValue returns correctly for matching values in matching
 * and non-matching namespaces.
 */
$['test nsContainsValue returns true for existing same-namespace values'] =
    function() {

  var ns = 'my',
      key = 'dog',
      value = 'drools';

  cache.nsSet(ns, key, value);
  var contains = cache.nsContainsValue(ns, value);
  assertTrue('nsContainsValue should have returned true.', contains);

  contains = cache.nsContainsValue('your', value);
  assertFalse('nsContainsValue should have returned false.', contains);
};


/**
 * Test that incrememt() successfully increments integers in the cache.
 */
$['test increment correctly incrememts integral values in the cache'] =
    function() {

  var key = 'lives',
      value = 10;

  cache.set(key, value);
  assertEquals('Value not properly set.', value, cache.get(key));

  var incrVal = cache.increment(key, 1);
  assertEquals('Value not properly incremented.', value + 1, incrVal);

  var decrVal = cache.increment(key, -1);
  assertEquals('Value not properly decremented.', value, decrVal);
};


/**
 * Test that increment() throws if key is unset and initialValue is not an
 * integer.
 */
$['test increment un-set key throws if initialValue is not an integer'] =
    function() {

  var key = 'missing',
      shouldThrow = function() {
        cache.increment(key, 1, 'fish');
      };
  assertThrows('increment should throw an error.', shouldThrow);
};


/**
 * Test that increment() sets the value to initialValue for an un-set key.
 */
$['test increment saves initialValue for un-set key'] = function() {
  var key = 'who?',
      val = cache.increment(key, 1, 5);

  assertEquals('increment did not return the proper value.',
               5, val);
  assertEquals('increment did not store the proper value in the cache.',
               5, cache.get(key));
};


/**
 * Test that increment() returns null if the key is not in the cache and no
 * initialValue is given.
 */
$['test increment returns null for non-existent key w/ no initialValue'] =
    function() {

  var key = 'The Who?';

  assertNull('The cache should have returned null.', cache.increment(key));
  assertUndefined('No value should have been stored for this key.',
                  cache.get(key));
};


/**
 * Test that increment() coerces string values to integers and increments
 * them properly.
 */
$['test increment properly coerces and increments strings'] = function() {
  var key = 'pretending',
      value = '10';

  cache.set(key, value);
  var newValue = cache.increment(key);
  assertEquals('Cache returned an incorrect value.', 11, newValue);
  assertEquals('Cache stored an incorrect value.', 11, cache.get(key));

  value = '20 feet';
  cache.set(key, value);
  var newValue = cache.increment(key);
  assertEquals('Cache returned an incorrect value.', 21, newValue);
  assertEquals('Cache stored an incorrect value.', 21, cache.get(key));
};


/**
 * Test that increment() throws if value is a non-numeric string.
 */
$['test increment throws for non-numeric strings'] = function() {
  var key = 'throw',
      value = 'tantrum',
      shouldThrow = function() {
        cache.increment(key);
      };

  cache.set(key, value);
  assertThrows('Should have thrown an error.', shouldThrow);
};


/**
 * Test that passing in a non-integer delta throws.
 */
$['test increment throws for non-integer delta'] = function() {
  var key = 'cueball',
      value = 0,
      shouldThrow1 = function() {
        cache.increment(key, 2.2);
      },
      shouldThrow2 = function() {
        cache.increment(key, 'break!');
      },
      shouldNotThrow = function() {
        cache.increment(key, '-9');
      };

  cache.set(key, value);
  assertThrows('Should have thrown for float delta.', shouldThrow1);
  assertThrows('Should have thrown for string delta.', shouldThrow2);
  assertNotThrows('Should not have thrown for integral string delta.',
                  shouldNotThrow);
};


/**
 * Test that decrementBelowZero = true allows for going from a positive value
 * to a negative one.
 */
$['test increment decrements below zero when decrementBelowZero is true'] =
    function() {

  var key = 'GoodGoesCrappy',
      value = 5,
      delta = -10;

  cache.set(key, value);
  var newVal = cache.increment(key, delta, undefined, true);
  assertEquals('Cache did not return a properly decremented value.',
               -5, newVal);
  assertEquals('Cache did not store a properly decremented value.',
               -5, cache.get(key));
};


/**
 * Test that decrementBelowZero = false floors decrements at 0.
 */
$['test increment floors decrements at 0 by default'] = function() {
  var key = 'GoodGoesMeh',
      value = 5,
      delta = -10;

  cache.set(key, value);
  var newVal = cache.increment(key, delta);
  assertEquals('Cache did not return a properly decremented value.',
               0, newVal);
  assertEquals('Cache did not store a properly decremented value.',
               0, cache.get(key));
};


/**
 * Test that increment does the right thing when decrementBelowZero is undefined
 * or false but the value is already negative.
 */
$['test increment when value is below zero'] = function() {
  var key = 'distance';

  cache.set(key, -5); // Handicap in the big race
  var oneStepForward = cache.increment(key);
  assertEquals('Cache should have incremented the value by 1 to -4',
               -4, oneStepForward);

  var twoStepsBack = cache.increment(key, -2);
  assertEquals('Increment should have decremented by 2 to -6.',
               -6, twoStepsBack);
};


/**
 * Test that increment throws for non-numeric values.
 */
$['test increment throws for incompatible value types'] = function() {
  var key = 'Wheel Of Fortune',
      values = [
        undefined,
        null,
        'spruce',
        {},
        [],
        new Date()
      ],
      shouldThrow = function() {
        cache.increment(key);
      };

  for (var i = 0, len = values.length; i < len; ++i) {
    var value = values[i];
    cache.set(key, value);
    assertThrows('increment did not throw for incompatible value: ' + value,
                 shouldThrow);
  }
};


/**
 * Test nsIncrement calls increment() properly.
 */
$['test nsIncrement calls increment() correctly'] = function() {
  var ns = 'Dr.',
      key = 'House',
      nsKey = '__' + ns + '__:' + key,
      initialValue = 2,
      value = 5,
      delta = -10,
      decrementBelowZero = true;

  cache.nsSet(ns, key, value);
  var incr = cache.increment = stubFn();

  cache.nsIncrement(ns, key, delta, initialValue, decrementBelowZero);

  assertEquals('nsIncrement called increment with the wrong key.',
               nsKey, incr.args[0]);
  assertEquals('nsIncrement called increment with the wrong delta.',
               delta, incr.args[1]);
  assertEquals('nsIncrement called increment with the wrong initial value.',
               initialValue, incr.args[2]);
  assertEquals('nsIncrement called increment with the wrong decrement flag.',
               decrementBelowZero, incr.args[3]);
};


/*
 * Tests to ensure that useNamespace returns a proper mirror of the cache.
 * There should be a test for each shadowed method.
 */


/**
 * Test that useNamespace returns a valid cache mirror.
 */
$['test useNamespace returns a valid mirror'] = function() {
  cache.thing = 5;
  cache.miscFunc = function() { return this.thing; };

  var nsCache = cache.useNamespace('namespace');

  assertTrue('Namespaced cache is not an instance of Cache.',
             nsCache instanceof relief.cache.Cache);
  assertEquals('Namespaced cache unable to access cache fields.',
               cache.map_, nsCache.map_);
  assertEquals('Namespaced cache unable to call cache methods.',
               5, nsCache.miscFunc());
};


/**
 * Test that useNamespace sets the namespace property on the returned cache
 * mirror.
 */
$['test useNamespace sets namespace property on mirror'] = function() {
  assertUndefined('cache.namespace should not exist prior to useNamespace.',
                  cache.namespace);

  var ns = 'testingSetNSProp';
  var mirror = cache.useNamespace(ns);
  assertEquals('cache.useNamespace did not properly store namespace property.',
               ns, mirror.namespace);
};


/**
 * Test that namespaced cache get calls the namespaced get with correct
 * arguments.
 */
$['test Shadowed get calls nsGet properly'] = function() {
  cache.nsGet = stubFn(3);

  var ns = 'test',
      key = 'NumOfPrimaryColors',
      nsCache = cache.useNamespace(ns);

  var colors = nsCache.get(key, 5);

  assertTrue('Cache nsGet not called.', cache.nsGet.called);
  assertEquals('Cache nsGet not called with correct namespace.',
               ns, cache.nsGet.args[0]);
  assertEquals('Cache nsGet not called with proper key.',
               key, cache.nsGet.args[1]);
  assertEquals('Cache nsGet not called with correct default value.',
               5, cache.nsGet.args[2]);
  assertEquals('Namespaced cache did not return the correct value.',
               3, colors);
};


/**
 * Test that namespaced cache set calls the namespaced set with correct
 * arguments.
 */
$['test Shadowed set calls nsSet properly'] = function() {
  var set = cache.nsSet = stubFn(),
      ns = 'test',
      key = 'NumOfPrimaryColors',
      nsCache = cache.useNamespace(ns);

  var colors = nsCache.set(key, 5);

  assertTrue('Cache nsSet not called.', set.called);
  assertEquals('Cache nsSet not called with correct namespace.',
               ns, set.args[0]);
  assertEquals('Cache nsSet not called with proper key.',
               key, set.args[1]);
  assertEquals('Cache nsSet not called with correct default value.',
               5, set.args[2]);
};


/**
 * Test that shadowed remove calls the namespaced remove with correct
 * arguments.
 */
$['test Shadowed remove calls nsRemove properly'] = function() {
  var remove = cache.nsRemove = stubFn(),
      ns = 'knowledge',
      key = 'ignorance',
      nsCache = cache.useNamespace(ns);

  nsCache.remove(key);
  assertTrue('Cache nsRemove not called.', remove.called);
  assertEquals('Cache nsRemove not called with correct namespace.',
               ns, remove.args[0]);
  assertEquals('Cache nsRemove not called with proper key.',
               key, remove.args[1]);
};


/**
 * Test that shadowed containsKey calls the namespaced containsKey correct
 * arguments.
 */
$['test Shadowed containsKey calls nsContainsKey properly'] = function() {
  var containsKey = cache.nsContainsKey = stubFn(),
      ns = 'USA',
      key = 'PA',
      nsCache = cache.useNamespace(ns);

  nsCache.containsKey(key);
  assertTrue('Cache nsContainsKey not called.', containsKey.called);
  assertEquals('Cache nsContainsKey not called with correct namespace.',
               ns, containsKey.args[0]);
  assertEquals('Cache nsContainsKey not called with proper key.',
               key, containsKey.args[1]);
};


/**
 * Test that shadowed containsValues calls the namespaced containsValues with
 * correct arguments.
 */
$['test Shadowed containsValue calls nsContainsValue properly'] = function() {
  var containsValue = cache.nsContainsValue = stubFn(),
      ns = 'haystack',
      key = 'itemToFind',
      value = 'needle',
      nsCache = cache.useNamespace(ns);

  nsCache.containsValue(value);
  assertTrue('Cache nsContainsValue not called.', containsValue.called);
  assertEquals('Cache nsContainsValue not called with correct namespace.',
               ns, containsValue.args[0]);
  assertEquals('Cache nsContainsValue not called with proper value.',
               value, containsValue.args[1]);
};


/**
 * Test that shadowed setByValue calls the namespaced setByValue with
 * correct arguments.
 */
$['test Shadowed setByValue calls nsSetByValue properly'] = function() {
  var setByValue = cache.nsSetByValue = stubFn(),
      ns = 'unimaginitive',
      key = 'test',
      value = 'values',
      nsCache = cache.useNamespace(ns);

  nsCache.setByValue(key, value);
  assertTrue('Cache nsSetByValue not called.', setByValue.called);
  assertEquals('nsSetByValue not called with correct namespace.',
               ns, setByValue.args[0]);
  assertEquals('nsSetByValue not called with proper key.',
               key, setByValue.args[1]);
  assertEquals('nsSetByValue not called with proper value.',
               value, setByValue.args[2]);
};


/**
 * Test that shadowed increment calls the namespaced increment with correct
 * arguments.
 */
$['test Shadowed increment calls nsIncrement properly'] = function() {
  var increment = cache.nsIncrement = stubFn(),
      ns = 'space',
      key = 'muppets',
      value = 5,
      nsCache = cache.useNamespace(ns);

  nsCache.set(key, value);
  var newVal = nsCache.increment(key);
  assertTrue('Cache nsIncrement not called.', increment.called);
  assertEquals('nsIncrment not called with proper namespace.',
               ns, increment.args[0]);
  assertEquals('nsIncrment not called with proper key.',
               key, increment.args[1]);
};


/**
 * Integration tests for cache.useNamespace() calls.
 */
$['test Integration tests for namespaced get and set methods'] = function() {
  var nsCache = cache.useNamespace('rock');
  nsCache.set('dmb', 'awesome');

  assertEquals('nsCache.get returned incorrect value.',
               'awesome', nsCache.get('dmb'));

  cache.nsSet('roll', 'pillsbury', 'flakey');
  assertEquals('nsCache.get returned incorrect value.',
               'flakey', cache.useNamespace('roll').get('pillsbury'));

  cache.useNamespace('thanksgiving').set('favorite', 'cranberry_sauce');
  assertEquals('cache.nsGet returned incorrect value.',
               'cranberry_sauce', cache.nsGet('thanksgiving', 'favorite'));

  assertEquals('nsCache.get did not return the given default value',
               'hole', nsCache.get('Black', 'hole'));

  nsCache.remove('dmb');
  assertUndefined('nsCache.delete failed to delete the value.',
                  cache.nsGet('rock', 'dmb'));

  cache.set('test', 5);
  cache.remove('test');
  assertUndefined('cache.delete failed to delete the value.',
                  cache.get('test'));

  assertTrue('cache.nsContainsValue did not find the value.',
             cache.nsContainsValue('thanksgiving', 'cranberry_sauce'));
};


/*
 * relief.cache.Cache.clone_ tests
 *
 * Since the implementation of goog.cloneObject was copied in
 * relief.cache.Cache.clone_, we're going to copy the tests here in case they
 * are ever removed from the Closure Library.
 */

$['test Clone primitive'] = function() {
  assertEquals('cloning a primitive should return an equal primitive',
      5, cloneObject(5));
};


$['test Clone object that has a clone method'] = function() {
  var original = {
    name: 'original',
    clone: function() { return { name: 'clone' } }
  };

  var clone = cloneObject(original);
  assertEquals('original', original.name);
  assertEquals('clone', clone.name);
};


$['test Clone flat object'] = function() {
  var original = {a: 1, b: 2, c: 3};
  var clone = cloneObject(original);
  assertNotEquals(original, clone);
  assertEquals(1, clone.a);
  assertEquals(2, clone.b);
  assertEquals(3, clone.c);
};


$['test Clone deep object'] = function() {
  var original = {
    a: 1,
    b: {c: 2, d: 3},
    e: {f: {g: 4, h: 5}},
    i: [1, 2, 3, {
      j: 4
    }]
  };
  var clone = cloneObject(original);

  assertNotEquals(original, clone);
  assertNotEquals(original.b, clone.b);
  assertNotEquals(original.e, clone.e);

  assertEquals(1, clone.a);
  assertEquals(2, clone.b.c);
  assertEquals(3, clone.b.d);
  assertEquals(4, clone.e.f.g);
  assertEquals(5, clone.e.f.h);

  assertEquals(1, clone.i[0]);
  assertEquals(2, clone.i[1]);
  assertEquals(3, clone.i[2]);
  assertEquals(4, clone.i[3].j);
};


$['test Clone functions'] = function() {
  var original = {
    f: function() {
      return 'hi';
    }
  };
  var clone = cloneObject(original);

  assertNotEquals(original, clone);
  assertEquals('hi', clone.f());

  // goog.typeOf() returns "function" for functions, so it is treated as not
  // an object, and is therefore the clone receives a reference to the same
  // function.
  assertEquals(original.f, clone.f);
};


function tearDown() {
  cache = null;
}
