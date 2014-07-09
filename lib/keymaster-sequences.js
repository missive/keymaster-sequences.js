(function (global) {
  'use strict';

  var re_space = new RegExp('\\s+')
    , timeout = 10000
    , sequences = {}
    , lastDocumentEvent = null;

  function keySequence(str, scope, method) {
    if (!re_space.test(str)) return key.apply(this, arguments);
    if (typeof scope == 'function') method = scope, scope = 'all';

    var keys = str.split(re_space)
      , addedHandlers = []
      , sequence = sequences[str] = {
            keys: keys
          , events: []
          , _gc: null
          , _working: null
        }
      , handler = function() {
          return sequenceHandler.apply([sequence,method], arguments);
        } // sequenceHandler.bind([sequence,method]);

    for (var i=0; i < keys.length; i++) {
      var k = keys[i];
      if (!~addedHandlers.indexOf(k)) {
        key(k, scope, handler);
        addedHandlers.push(k);
      }
    };
  }

  function sequenceHandler(evt, handler) {
    var sequence = this[0]
      , method = this[1]
      , curTarget
      , lastEvt;

    if (null === sequence._working) {
      resetSequence(sequence);
      sequence._gc = setTimeout(function() {
        resetSequence(sequence);
      }, timeout);
    }

    curTarget = sequence._working[0];
    lastEvt = sequence.events[sequence.events.length - 1] || null;

    if (handler.shortcut == curTarget && (lastEvt === null || lastEvt === lastDocumentEvent)) {
      sequence._working.shift()
      sequence.events.push(evt);

      if (sequence._working.length == 0) {
        resetSequence(sequence);
        return method(evt, handler, sequence);
      }
    }
    else {
      resetSequence(sequence);
    }
  }

  function resetSequence(sequence) {
    sequence._working = sequence.keys.slice(0);
    sequence.events = [];
    if (null !== sequence._gc) {
      clearTimeout(sequence._gc);
      sequence._gc = null;
    }
  }

  function addEvent(object, event, method) {
    if (object.addEventListener)
      object.addEventListener(event, method, false);
    else if(object.attachEvent)
      object.attachEvent('on'+event, function(){ method(window.event) });
  };

  addEvent(document, 'keydown', function(event) {
    lastDocumentEvent = event;
  });

  if (!!global.key && typeof global.key.isPressed == 'function') {
    global.key.sequence = keySequence;
  }
  else console.warn('keymaster-sequences.js could not found keymaster.js');
})(this);