var debug = false;

colorString = function(str) { return '%c' + str; }
gray = 'color:#aaaaaa';

set = function(v) {
  return { label : 'set', value : v };
}
MSG = function(l) {
  return { label : l };
}

initHandlers = function(obj) {
  obj.handlers = [];
}
add = function(obj, hook) {
  obj.handlers.push(hook);
}
addLabel = function(obj, label, hook) {
  obj.handlers.push(
      function(msg) {
        if (msg.label === label)
          hook(msg)
      });
}
send = function(obj, msg) {
  if (debug)
    console.log(colorString('send: '), gray, obj.name, msg);
  var call = function(h) { h(msg) };
  _.each(obj.handlers, call);
}

createMap = function(m, s, t) {
  s.addMap(function(msg$) {
    var msg = m(msg$);
    if (msg) {
      send(t, msg);
    }
  });
}
createLift = function(m, s, t) {
  var id = _.uniqueId();

  s.addMap(function(msg$) {
    if (msg$._source !== id) {
      var msg = m.apply(msg$);
      if (msg) {
        var os = msg._source;
        msg._source = id;
        send(t, msg);
        msg._source = os;
      }
    } else {
      //console.log('map stopped');
    }
  });
  t.addMap(function(msg$) {
    if (msg$._source !== id) {
      var msg = m.lift(s, msg$);
      if (msg) {
        var os = msg._source;
        msg._source = id;
        send(s, msg);
        msg._source = os;
      }
    } else {
      //console.log('lift stopped');
    }
  });

  return t;
}

idLift = {};
idLift.apply = function(msg) { return msg; };
idLift.lift = function(s, msg) { return msg; };

defaultAdder = function(obj) {
  obj.addMap = function(hook) {
    add(obj, hook);
  }
}


// List of pairs [[k,v], [k,v],...]
lookup = function(map, key) {
  var mpair = _.find(map, function(pair) { return pair[0] === key; });
  if (mpair)
    return mpair[1];
}

// Map from obj to keys
// keyMap is list of pairs [key, msg]
keyLift = function(keyMap) {
  var lift = {};
  // the KEYS object doesn't do anything?
  lift.apply = function(msg) { return undefined; };
  lift.lift = function(s, msg) {
    var mmsg = lookup(keyMap, msg.value);
    if (mmsg)
      return mmsg;
    else
      return msg;
  }

  return lift;
}

addKeyBinding = function(obj, keys, keyMap) {
  createLift(keyLift(keyMap), obj, keys);
}
projLift = function(name) {
  var lift = {};
  lift.apply = function(msg) {
    if (msg.label === name) {
      return msg.msg;
    } else {
      //return { label : 'nil' };
      return undefined;
    }
  }
  lift.lift = function(s, msg) {
    return { label : name, msg : msg };
  }
  return lift;
}
fstLift = projLift('fst');
sndLift = projLift('snd');

createProj = function(name, s, t) {
  return createLift(projLift(name), s, t);
}
createId = function(s, t) {
  return createLift(idLift, s, t);
}

//fstLift = {};
//fstLift.apply = function(msg) {
//  if (msg.label === 'fst') {
//    return msg.msg;
//  } else {
//    return { label : 'nil' };
//  }
//}
//fstLift.lift = function(s, msg) {
//  return { label : 'fst', msg : msg }
//};
//sndLift = {};
//sndLift.apply = function(msg) {
//  if (msg.label === 'snd') {
//    return msg.msg;
//  } else {
//    return { label : 'nil' };
//  }
//}
//sndLift.lift = function(s, msg) {
//  return { label : 'snd', msg : msg }
//};
