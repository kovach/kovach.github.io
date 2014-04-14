map = function() {
  var m = this;

  m.count = 0;
  m.env = [];

  m.insert = function(x) {
    var name = m.count;
    m.count += 1;
    m.env.push(x);
    return name;
  };

  m.look = function(k) {
    return m.env[k];
  }

  m.values = function() {
    return m.env;
  }
}

obj = function(name, refs) {
  this.head = name;
  this.refs = refs;
}
nil = function() {
  return new obj('nil', []);
}
cons = function(ref1, ref2) {
  return new obj('cons', [ref1, ref2]);
}
stringC = function(str) {
  return new obj(str, []);
}

printThing = function(ref, env) {
  var o = env.look(ref);
  return o.head + '\n' + _.map(o.refs, function(ref) { return printThing(ref, env) }).join('');
}

toList = function(ref, env) {
  var toList$ = function(acc, ref, env) {
    var o = env.look(ref);
    switch (o.head) {
      case 'nil':
        return acc;
      case 'cons':
        acc.push(env.look(o.refs[0]));
        return toList$(acc, o.refs[1], env);
        //return [env.look(o.refs[0])].concat(toList(o.refs[1], env));
    }
  }

  return toList$([], ref, env);
}
unzip = function(front, back, env) {
  var blist = toList(back, env);
  var flist = toList(front, env);
  flist.reverse();
  return _.reduce(blist,
      function(acc, x) { return acc.concat([x]); },
      flist);

}

pair = function(ref1, ref2) {
  return new obj('pair', [ref1, ref2]);
}

zipper = function(name) {
  var z = this;
  z.name = name;
  initHandlers(z);

  defaultAdder(z);

  //z.addMap = function(statefulHook) {
  //  add(z, statefulHook(z));
  //}

  var e = new map();
  var cursor = new intNum(name+'_cursor');

  var front = e.insert(nil());
  var back  = e.insert(nil());

  z.env = e;
  z._front = [front];
  z._back  = [back];

  z.cursor = cursor;

  z.setFront = function(ref) {
    z._front.push(ref);
  }
  z.front = function() {
    return _.last(z._front);
  }
  z.setBack = function(ref) {
    z._back.push(ref);
  }
  z.back = function() {
    return _.last(z._back);
  }

  z.insert = function(x) {
    var head = e.insert(x);
    z.setFront(e.insert(cons(head, z.front())));
    send(cursor, { label : 'inc' });
  }
  z.left = function() {
    var l = e.look(z.front());
    switch (l.head) {
      case 'nil': return;
      case 'cons':
        var head = l.refs[0];
        var rest = l.refs[1];
        z.setFront(rest);
        z.setBack(e.insert(cons(head, z.back())));
        send(cursor, { label : 'dec' });
    }
  }
  z.right = function() {
    var r = e.look(z.back());
    switch (r.head) {
      case 'nil': return;
      case 'cons':
        var head = r.refs[0];
        var rest = r.refs[1];
        z.setBack(rest);
        z.setFront(e.insert(cons(head, z.front())));
        send(cursor, { label : 'inc' });
    }
  }
  z.del = function() {
    var r = e.look(z.back());
    switch (r.head) {
      case 'nil': return;
      case 'cons':
        var rest = r.refs[1];
        z.setBack(rest);
    }
  }

  z.print = function() {
    console.log('front:\n', printThing(z.front(), z.env));
    console.log('back:\n', printThing(z.back(), z.env));
  }

  z.current = function() {
    var r = e.look(z.back());
    switch (r.head) {
      case 'nil': return;
      case 'cons':
        return e.look(r.refs[0]);
    }
  }

  z.toList = function() {
    return unzip(z.front(), z.back(), z.env);
  }
  z.toString = function() {
    var strings = unzip(z.front(), z.back(), z.env);
    return _.pluck(strings, 'head').join("");
  }


  addLabel(z, 'insert', function(msg) {
    z.insert(msg.value);
  });
  addLabel(z, 'left', function(msg) {
    z.left();
  });
  addLabel(z, 'right', function(msg) {
    z.right();
  });
  addLabel(z, 'delete', function(msg) {
    z.del();
  });
  addLabel(z, 'print', function(msg) {
    z.print();
  });

  z.addMap(function(msg) {
    switch (msg.label) {
      case 'insert':
      case 'right':
        //send(cursor, { label : 'inc' });
        break;

      case 'left':
        //send(cursor, { label : 'dec' });
        break;
    }
  });

    
}

zipperListMap = function(z) {
  return function(msg) {
    switch (msg.label) {
      case 'insert':
        return set(z.toList());
      case 'delete':
        return set(z.toList());
    }
  }
}
textZipperMap = function(z) {
  return function(msg) {
    switch (msg.label) {
      case 'insert':
        return set(z.toString());
      case 'delete':
        return set(z.toString());
    }
  }
}

makeCursorPosition = function(coord, row, col, rect) {
  var cw = nm(0);
  var ch = nm(0);
  var adjust = nm(0);
  var hoffset = times(col, cw);
  var voffset = plus(times(row, ch), adjust);
  var offset = vplus(coord, pt(hoffset, voffset));
  rect.coord(offset);

  // TODO fix this doublehack
  send(ch, set(charHeight));
  send(cw, set(charWidth));
  send(adjust, set(-charHeight+5));
}
makeLineCursorPosition = function(line, rect) {

  var coord = new point('');
  line.coord(coord);
  var hoffset = times( line.state.zipper.cursor
                     , nm(charWidth));
  var voffset = new num('');
  var offset = vplus(coord, pt(hoffset, voffset));
  rect.coord(offset);

  // TODO fix this doublehack
  send(voffset, set(-charHeight + 5));
}
