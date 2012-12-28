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
 * Provides basic default PageConfig objects for the error states (:403,
 * :404, :501).  These can be used for quickly getting an app up and running,
 * but developers should think about how they really want to handle these
 * cases before using them in production.
 */

goog.provide('relief.handlers.errors');

goog.require('relief.handlers.MessageHandler');
goog.require('relief.handlers.templates');


/**
 * Page not found
 * @type {relief.handlers.MessageHandler.PageConfig}
 */
relief.handlers.errors.Error404 = {
  handler: relief.handlers.MessageHandler,
  message: {
    template: relief.handlers.templates.genericError,
    templateParams: {
      header: 'Page Not Found',
      details: 'The page you have requested does not exist.'
    }
  }
};


/**
 * Not authorized.
 * @type {relief.handlers.MessageHandler.PageConfig}
 */
relief.handlers.errors.Error401 = {
  handler: relief.handlers.MessageHandler,
  message: {
    template: relief.handlers.templates.genericError,
    templateParams: {
      header: 'Not Authorized',
      details: 'You are not authorized to view the requested page.'
    }
  }
};


/**
 * Not yet implemented.
 * @type {relief.handlers.MessageHandler.PageConfig}
 */
relief.handlers.errors.Error501 = {
  handler: relief.handlers.MessageHandler,
  message: {
    template: relief.handlers.templates.genericError,
    templateParams: {
      header: 'Not Yet Implemented',
      details: 'The page you have requested has not yet been created.  ' +
          'Please be patient.'
    }
  }
};
