object = function(name) {
  var o = this;
  o.name = name;
  initHandlers(o);
  defaultAdder(o);
}

num = function(name) {
  var n = this;
  n.name = name;
  initHandlers(n);
  defaultAdder(n);

  n.value = 0;

  addLabel(n, 'set', function(msg) {
    n.value = msg.value;
  });

}

intNum = function(name) {
  var n = this;
  n.name = name;
  initHandlers(n);
  defaultAdder(n);

  n.value = 0;

  addLabel(n, 'set', function(msg) {
    n.value = msg.value;
  });

  addLabel(n, 'inc', function(msg) {
    n.value += 1;
  });

  addLabel(n, 'dec', function(msg) {
    n.value -= 1;
  });

  n.addMap = function(hook) {
    add(n, hook);
  }
}

nm = function(val) {
  var id = _.uniqueId();
  var n = new num(id);
  send(n, set(val));
  return n;
}

pt = function(x, y) {
  var id = _.uniqueId();
  var p = new point(id);
  createProj('x', p, x);
  createProj('y', p, y);
  return p;
}

stringEl = function(name) {
  var n = this;
  n.name = name;
  initHandlers(n);

  n.value = '';

  addLabel(n, 'set', function(msg) {
    n.value = msg.value;
  });

  n.addMap = function(hook) {
    add(n, hook);
  }
}

tuple = function(name, x, y) {
  var t = this;
  t.name = name;
  initHandlers(t);

  t.state = {};
  t.state.fst = x;
  t.state.snd = y;

  t.addMap = function(hook) {
    add(t, function(msg) {
      var os = msg._state;
      msg._state = t.state;
      hook(msg);
      msg._state = os;
    })
  }

  createLift(fstLift, t, x);
  createLift(sndLift, t, y);


  // Special map creators
//  t.fst = function(obj) {
//    return createLift(fstLift, t, obj);
//  }
//  t.snd = function(obj) {
//    return createLift(sndLift, t, obj);
//  }

  addLabel(t, 'set', function(msg) {
    send(t.state.fst, { label : 'set', value : msg.value.fst });
    send(t.state.snd, { label : 'set', value : msg.value.snd });
  });
}

plusLift = {};
plusLift.apply = function(msg) {
  return set(msg._state.fst.value + msg._state.snd.value);
};
plusLift.lift = function(s, msg) {
  var diff = msg.value - s.state.snd.value;
  return { label : 'fst', msg : { label : 'set', value : diff } };
}
timesLift = {};
timesLift.apply = function(msg) {
  return set(msg._state.fst.value * msg._state.snd.value);
};
timesLift.lift = function(s, msg) {
  var diff = msg.value / s.state.snd.value;
  return { label : 'fst', msg : { label : 'set', value : diff } };
}

pointSum = function(p1, p2) {
  return { x : p1.x.value + p2.x.value
         , y : p1.y.value + p2.y.value
         };
}

//vplusLift = {};
//vplusLift.apply = function(msg) {
//  return set(pointSum(msg._state.fst.state, msg._state.snd.state));
//}
//vplusLift.lift = function(s, msg) {
//  var diffx = msg._state.x.value - s.state.snd.state.x.value;
//  var diffy = msg._state.y.value - s.state.snd.state.y.value;
//
//  return { label : 'fst', msg : { label : 'set', value : { x : diffx, y : diffy }}};
//}

box = function(name) {
  var b = this;
  b.name = name;
  initHandlers(b);

  b.state = {};
  b.state.width  = new num(name+'_width');
  b.state.height = new num(name+'_height');

  addLabel(b, 'set', function(msg) {
    send(b.state.width,  { label : 'set', value : msg.value.width  });
    send(b.state.height, { label : 'set', value : msg.value.height });
  });

  b.addMap = function(hook) {
    add(b, hook);
  }
}

rect = function(name) {
  var b = this;
  b.name = name;
  initHandlers(b);
  defaultAdder(b);

  var bx = new box(name+'_box');
  var coord = new point(name+'_coord');

  b.state = {};
  b.state.box = bx;
  b.state.coord = coord;
  b.state.svg = addRect(bx.state.width.value, bx.state.height.value).elem;

  b.coord = function(obj) {
    return createProj('coord', b, obj);
  }
  b.box = function(obj) {
    return createProj('box', b, obj);
  }

  b.coord(coord);
  b.box(bx);

  addLabel(b, 'coord', function(msg) {
    b.state.svg
      .attr('x', coord.state.x.value)
      .attr('y', coord.state.y.value)
      ;
  });
  addLabel(b, 'box', function(msg) {
    b.state.svg
      .attr('width' , bx.state.width.value)
      .attr('height', bx.state.height.value)
      ;
  });
  addLabel(b, 'hide', function(msg) {
    b.state.svg.attr("opacity", 0);
  });
  addLabel(b, 'show', function(msg) {
    b.state.svg.attr("opacity", 1);
  });
}

point = function(name) {
  var p = this;
  p.name = name;
  initHandlers(p);

  var x = new num(name+'_x');
  var y = new num(name+'_y');

  p.state = {};
  p.state.x = x;
  p.state.y = y;

  p.addMap = function(hook) {
    add(p, function(msg) {
      var os = msg._state;
      msg._state = p.state;
      hook(msg);
      msg._state = os;
    })
  }

  createProj('x', p, x);
  createProj('y', p, y);

  addLabel(p, 'set', function(msg) {
    send(p.state.x, { label : 'set', value : msg.value.x });
    send(p.state.y, { label : 'set', value : msg.value.y });
  });
}



textElem = function(name) {
  var t = this;
  t.name = name;
  initHandlers(t);

  t.addMap = function(hook) {
    add(t, function(msg) {
      var os = msg._state;
      msg._state = t.state;
      hook(msg);
      msg._state = os;
    })
  }

  var coord = new point(name+'_coord');
  var x = coord.state.x;
  var y = coord.state.y;
  var str = new stringEl(name+'_string');

  t.state = {};
  t.state.string = str;
  t.state.coord = coord;
  // ignore id value for now
  t.state.svg = addText(str.value, x.value, y.value).elem;

  t.coord = function(obj) {
    return createProj('coord', t, obj);
  }
  t.string = function(obj) {
    return createProj('string', t, obj);
  }

  t.coord(t.state.coord);
  t.string(t.state.string);

  t.box = function(obj) {
    addLabel(t, 'string', function(msg) {
      var box = t.state.svg.node().getBBox();
      send(obj, { label : 'set', value : { width : box.width, height : box.height } });
    });

    return obj;
  }

  addLabel(t, 'string', function(msg) {
    t.state.svg.text(msg.msg.value);
  });
  addLabel(t, 'coord', function(msg) {
    var elem = t.state.svg;
    elem.attr("x", t.state.coord.state.x.value);
    elem.attr("y", t.state.coord.state.y.value);
  });
  addLabel(t, 'hide', function(msg) {
    t.state.svg.attr("opacity", 0);
  });
  addLabel(t, 'show', function(msg) {
    t.state.svg.attr("opacity", 1);
  });
  addLabel(t, 'color', function(msg) {
    t.state.svg.style("fill", msg.value);
  });
  addLabel(t, 'background', function(msg) {
  });
  
}

// TODO pass in coord/box functions explicitly
blob = function(name, elem) {
  var b = this;
  b.name = name;
  initHandlers(b);

  b.state = {};
  b.state.elem = elem;

  b.coord = function(coord) {
    b.state.elem.coord(coord);
  }
  b.box = function(box) {
    b.state.elem.box(box);
  }

  b.addMap = function(hook) {
    add(b, hook);
  }
}

// TODO add padding between elems
// add 'coord' and 'box' functions needed for composition
hblock = function(name, elem1, elem2) {
  var b = this;
  b.name = name;
  initHandlers(b);
  defaultAdder(b);

  b.state = {};
  b.state.elem1 = elem1;
  b.state.elem2 = elem2;

  var x = new num(name+'_num');
  var w = new num(name+'_width1');
  var coord1 = new point(name+'_coord1');
  elem1.coord(coord1);
  var coord2 = new point(name+'_coord2');
  elem2.coord(coord2);
  var box1 = new box(name+'_box1');
  elem1.box(box1);
  //var summand =
  //  new tuple(name+'_summand',
  //      coord1.state.fst,
  //      box1.state.width);
  //var sum = new num(name+'_sum');
  var sum = plus(coord1.state.x, box1.state.width);
  createLift(plusLift, summand, sum);
  createProj('x', coord2, sum);

  createId(coord1.state.y, coord2.state.y);

  b.state.summand = summand;
  b.state.box1 = box1;
}
vblock = function(name, elem1, elem2) {
  var b = this;
  b.name = name;
  initHandlers(b);
  defaultAdder(b);

  b.state = {};
  b.state.elem1 = elem1;
  b.state.elem2 = elem2;

  var p1 = new point(name+'_p1');
  elem1.coord(p1);
  var p2 = new point(name+'_p2');
  elem2.coord(p2);
  var box1 = new box(name+'_box1');
  elem1.box(box1);

  createProj('x', p2, p1.state.x);
  createProj('y', p2, plus(p1.state.y, box1.state.height));

  b.coord = function(obj) {
    return elem1.coord(obj);
  }
}

plus = function(x, y) {
  var name = _.uniqueId();
  var args = new tuple(name+'_args', x, y);
  var sum = new num(name);

  createLift(plusLift, args, sum);
  return sum;
}

vplus = function(p1, p2) {
  var name = _.uniqueId();
  var sum = new point(name);

  createProj('x', sum, plus(p1.state.x, p2.state.x));
  createProj('y', sum, plus(p1.state.y, p2.state.y));
  return sum;
}

times = function(x, y) {
  var name = _.uniqueId();
  var args = new tuple(name+'_args', x, y);
  var prod = new num(name);

  createLift(timesLift, args, prod);
  return prod;
}


keyPressHandler = function(keys) {
  return function() {
    var ev = d3.event;
    var c = String.fromCharCode(ev.keyCode);

    // Handle some special keys
    switch (ev.keyCode) {
      case 13:
        c = "RETURN";
        break;
      case 32:
        c = "SPACE";
        break;
    }

    send(keys, { label : 'press', value : c });
  }
}
keyDownHandler = function(keys) {
  return function() {
    var ev = d3.event;
    if (debug)
      console.log(ev.keyCode);
    switch (ev.keyCode) {
      case 8:
        send(keys, { label : 'press', value : 'BACKSPACE' });
        break;
      case 27:
        send(keys, { label : 'press', value : 'ESCAPE' });
        break;
      case 37:
        send(keys, { label : 'press', value : 'LEFT' });
        break;
      case 38:
        send(keys, { label : 'press', value : 'UP' });
        break;
      case 39:
        send(keys, { label : 'press', value : 'RIGHT' });
        break;
      case 40:
        send(keys, { label : 'press', value : 'DOWN' });
        break;
      default:
        return;
    }
  }
}

// Singleton object for keyboard
initKeyboard = function() {

  var keyboard = function() {
    var k = this;
    k.name = "KEY";
    initHandlers(k);
    defaultAdder(k);

    k.state = {};
    k.state.log = [];

    addLabel(k, 'press', function(msg) {
      if (debug)
        console.log(colorString('key: '), gray, msg.value);
      k.state.log.push(msg.value);
    });
  }

  var keys = new keyboard();

  d3.select('body')
    .on("keypress", keyPressHandler(keys))
    .on("keydown", keyDownHandler(keys))
    ;
  return keys;
}

var Ask = 'ask';
var Ref = 'ref';
var App = 'app';

//env = function(name, ref) {
//  var e = this;
//  e.name = name;
//  initHandlers(e);
//  defaultAdder(e);
//
//  e.state = {};
//  e.state.env = [];
//  e.state.ref = ref;
//
//  addLabel(e, 'new', function(msg) {
//
//    var id = _.uniqueId();
//    var ref = e.state.ref;
//
//    switch (msg.constructor) {
//      case 'ask':
//        e.state.env.push([id, Ask, ref]);
//        break;
//      case 'ref':
//        e.state.env.push([id, Ref, ref]);
//        break;
//      case 'app':
//        e.state.env.push([id, App, ref]);
//        break;
//    }
//  });
//}

// TODO update to cause environment insertions
termObject = function(name) {
  var t = this;
  t.name = name;
  initHandlers(t);
  defaultAdder(t);


  var text = new textElem(name+'_text');
  send(text.state.string, set('.'));
  // TODO fix this
  send(text.state.coord, set({ x : 100, y : 100 }));

  var str = text.string(new stringEl(name+'_string'));

  addLabel(t, 'press', function(msg) {
    switch (msg.value) {
      case 's':
        send(str, set(Ask));
        break;
      case 'r':
        send(str, set(Ref));
        break;
      case 'a':
        send(str, set(App));
        break;
    }
  });
  addLabel(t, 'hide', function(msg) {
    send(text, msg);
  });
  addLabel(t, 'show', function(msg) {
    send(text, msg);
  });
}
