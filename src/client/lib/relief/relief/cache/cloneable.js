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
 * The Cloneable interface tags an object as having a clone() method.
 */

goog.provide('relief.cache.Cloneable');



/**
 * A Cloneable object is one that provides its own clone() method.  Only objects
 * that implement the Cloneable or the SimpleValue interfaces can be passed to
 * the cache by value.
 *
 * @interface
 */
relief.cache.Cloneable = function() {};


/**
 * @return {!Object} The object's clone.
 */
relief.cache.Cloneable.prototype.clone = goog.abstractMethod;
