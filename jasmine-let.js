/*jslint indent: 2 */
/*global module */

function jasmineLet(jasmine, namespace) {
  "use strict";

  var env;
  var scopes = {};
  var propertyNames = [];
  var suiteIdStack = [];

  env = jasmine.getEnv();
  env.addReporter({
    suiteStarted: function(result) {
      suiteIdStack.push(result.id);
    },
    suiteDone: function() {
      suiteIdStack.pop();
    }
  });

  function declare(suite, name, expr, options) {
    var scope, block;

    if (options === null || typeof options !== "object") {
      options = {};
    }

    if (typeof expr === "function") {
      block = expr;
    } else {
      block = function () { return expr; };
    }

    scope = scopes[suite.id] || (scopes[suite.id] = {});
    scope[name] = block;

    if (options.evaluateBefore) {
      suite.beforeEach(function () {
        /*jslint expr:true */
        namespace[name];
      });
    }
  }

  function makeGetter(name, values, fn) {
    return function () {
      if (values.hasOwnProperty(name)) {
        return values[name];
      }
      return values[name] = fn();
    };
  }

  function makeSetter(name, values) {
    return function (val) { values[name] = val; };
  }

  function defineProperties() {
    var declarations, values;

    values = {};

    function defineProperty(name) {
      if (propertyNames.indexOf(name) >= 0) { return; }

      propertyNames.push(name);
      Object.defineProperty(namespace, name, {
        enumerable: true,
        configurable: true,
        get: makeGetter(name, values, declarations[name]),
        set: makeSetter(name, values)
      });
    }

    for (var i = suiteIdStack.length-1; i >= 0; i--) {
      declarations = scopes[suiteIdStack[i]];
      if (!declarations) continue;

      Object.keys(declarations).forEach(defineProperty);
    }
  }

  function deleteProperties() {
    var name;

    while ((name = propertyNames.pop(name))) {
      delete namespace[name];
    }
  }

  env.beforeEach(defineProperties);
  env.afterEach(deleteProperties);

  return declare;
}

if (typeof module !== 'undefined') {
  module.exports = jasmineLet;
}
