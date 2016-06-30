/*global window */
/*global document */
(function (global, doc, keymaster) {
  'use strict';

  var reSpace = new RegExp('\\s+')
    , reSeq = new RegExp('^seq_')
    , timeout = 1000
    , timer = null
    , prevScope = ''
    , addedHandlers = {};

  function keySequence(str, scope, method) {
    /*jshint validthis:true */

    if (typeof scope === 'function') {
      method = scope;
      scope = 'all';
    }

    if (!reSpace.test(str)) {
      return keymaster(str, scope, function() {
        if (reSeq.test(keymaster.getScope())) { return; }
        return method.apply(this, arguments);
      });
    }

    var keys = str.split(reSpace)
      , seqScope = 'seq_'
      , aScope, k, prevK;

    for (var i=0; i < keys.length; i++) {
      k = keys[i];
      prevK = keys[i - 1];
      aScope = scope;

      if (prevK) {
        aScope = seqScope += prevK;
      }

      if (!addedHandlers[aScope]) {
        addedHandlers[aScope] = {};
      }

      if (!addedHandlers[aScope][k]) {
        keymaster(k, aScope, sequenceHandler);
        addedHandlers[aScope][k] = { method: null };
      }
    }

    // Add method on the last sequence key
    addedHandlers[aScope][k].method = method;
  }

  function sequenceHandler(evt, handler) {
    /*jshint validthis:true */

    var scope = keymaster.getScope();

    clearTimeout(timer);
    timer = setTimeout(resetSequence, timeout);

    // Currently in sequence
    if (reSeq.test(handler.scope)) {
      var k = handler.shortcut
        , data = addedHandlers[scope][k] || {};

      // Finishing sequence
      if (data.method) {
        setTimeout(function() {
          resetSequence();
          data.method.call(this, evt, handler);
        }, 0);

      // Continuing sequence
      } else {
        keymaster.setScope(scope + handler.shortcut);
      }

    // Starting sequence
    } else {
      if (reSeq.test(scope)) { return; }
      prevScope = scope;
      keymaster.setScope('seq_' + handler.shortcut);
    }
  }

  function resetSequence() {
    clearTimeout(timer);
    keymaster.setScope(prevScope);
  }

  if (!!keymaster && typeof keymaster.isPressed === 'function') {
    keymaster.sequence = keySequence;
  }
  else {
    console.warn('keymaster-sequences.js could not find keymaster.js');
  }
})(window, document, window.key);
