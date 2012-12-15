#!/usr/bin/env /devel/ringojs/bin/ringo

/**
 * @fileoverview
 * Traverse the given directory looking for *_test.js files.  When found,
 * read the file, scanning for lines that match Relief's style of declaring
 * test functions ($ = window):
 *
 *    $['test Name of test function']
 */

// Imports
var fs = require('fs');

// Input parameters
var dir = arguments[1] || '/devel/closure-gallery/client-src/relief/';

var fileNames = fs.listTree(dir),
    tests = {},
    totalTestCount = 0,
    lineTest = /^\$\[\'[^']*\'\]/;
    // Matches test declarations of the form "$['test That something works']"
    // where $ = window.

for (let i = 0, len = fileNames.length; i < len; ++i) {
  let matches = fileNames[i].match(/^(.*?)_test.js$/),
      isSvn = fileNames[i].match(/svn/);
  if ((! isSvn) && matches && matches[1] !== '') {
    let test = matches[1],
        file = fs.open(dir + fileNames[i], {read: true}),
        testsInFile = 0;

    let contents = file.read();

    if (contents) {
      let lines = contents.split('\n');
      for(let j = 0, lineCount = lines.length; j < lineCount; ++j) {
        let line = lines[j],
            testMatch = null;
        
        if(line.match(lineTest)) {
          ++testsInFile;
        }
      }
      totalTestCount += testsInFile;
      tests[test] = testsInFile;
    }
  }
}

tests.totalTestCount = totalTestCount;
exports.testCount = tests;

if (require.main === module) {
  print(JSON.stringify(tests, null, '  '));
}
