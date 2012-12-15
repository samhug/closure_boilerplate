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
 * The SimpleValue interface is a tag interface that tells relief.cache.Cache
 * instances that a value is safe to clone.  Values that are safe to clone
 * include any valid JSON object, non-recursive arrays and objects, and
 * primitive values.  See the JSDoc for this interface as well as
 * relief.cache.Cache.clone_ for more details.
 */

goog.provide('relief.cache.SimpleValue');



/**
 * The SimpleValue interface has no methods.  It is used solely by developers
 * who wish to declare to the cache framework (via the Closure Compiler's type
 * checking logic) that a value is safe to be run through a deep cloning
 * function (namely, relief.cache.Cache.clone_).  Obviously, primitive values
 * are safely cloneable, but caveats must be understood for Arrays and Objects.
 *
 * By casting an object to a SimpleValue, the developer is acknowledging that
 * the risks and constraints are understood.  Cloning an object that does not
 * comply will very likely have unpredictable results.
 *
 * WARNINGS:
 * relief.cache.Cache.clone_ does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * relief.cache.Cache.clone_ is unaware of unique identifiers, and copies
 * UIDs created by <code>goog.getUid</code> into cloned results.
 *
 * @interface
 */
relief.cache.SimpleValue = function() {};
