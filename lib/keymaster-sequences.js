/*global window */
/*global document */
(function (global, doc, keymaster) {
  'use strict';

  var reSpace = new RegExp('\\s+')
    , timeout = 1000
    , sequences = {};

  function keySequence(str, scope, method) {
    /*jshint validthis:true */

    if (false === reSpace.test(str)) {
      return keymaster.apply(this, arguments);
    }

    if (typeof scope === 'function') {
      method = scope;
      scope = 'all';
    }

    var keys = str.split(reSpace)
      , addedHandlers = []
      , sequence = sequences[str] = {
            keys: keys
          , _gc: null
          , _working: null
        }
      , handler = function() {
          var args = Array.prototype.slice.call(arguments, 0);
          args.unshift(sequence, method);
          return sequenceHandler.apply(this, args);
        };

    for (var i=0; i < keys.length; i++) {
      var k = keys[i];
      if (!~addedHandlers.indexOf(k)) {
        keymaster(k, scope, handler);
        addedHandlers.push(k);
      }
    }
  }

  function sequenceHandler(sequence, method, evt, handler) {
    /*jshint validthis:true */

    var curTarget;

    if (null === sequence._working) {
      resetSequence(sequence);
    }

    clearTimeout(sequence._gc);
    sequence._gc = setTimeout(function() {
      resetSequence(sequence);
    }, timeout);

    curTarget = sequence._working[0];

    if (handler.shortcut === curTarget) {
      sequence._working.shift();

      if (sequence._working.length === 0) {
        resetSequence(sequence);
        return method.call(this, evt, handler, sequence);
      }
    }
    else {
      resetSequence(sequence);
    }
  }

  function resetSequence(sequence) {
    sequence._working = sequence.keys.slice(0);
    if (null !== sequence._gc) {
      clearTimeout(sequence._gc);
      sequence._gc = null;
    }
  }

  if (!!keymaster && typeof keymaster.isPressed === 'function') {
    keymaster.sequence = keySequence;
  }
  else {
    console.warn('keymaster-sequences.js could not find keymaster.js');
  }
})(window, document, window.key);
