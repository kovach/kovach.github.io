// TODO make vblock
//
// Objects for text manipulation
//

lineEditor = function(name) {
  var o = this;
  o.name = name;
  initHandlers(o);
  defaultAdder(o);

  o.state = {};
  var z = new zipper();
  o.state.zipper = z;
  o.state.state = 'command';


  // Display the editor
  var elem = new textElem(name+'_textElem');
  o.state.elem = elem;
  createMap(textZipperMap(z), z, elem.state.string);

  var r = new rect(name+'rect');
  o.state.cursor = r;
  send(r, { label : 'box'
          , msg : set({ width : charWidth, height : charHeight })
          }
      );

  o.coord = function(obj) {
    return elem.coord(obj);
  }
  o.string = function(obj) {
    return elem.string(obj);
  }
  o.box = function(obj) {
    return elem.box(obj);
  }

  // TODO fix one of these
  //addLabel(o, 'coord', function(msg) {
  //  send(elem, msg);
  //});
  //o.coord(o);

//  addLabel(o, 'command', function(msg) {
//    o.state.state = 'command';
//    console.log('command mode');
//  });
//  addLabel(o, 'insert', function(msg) {
//    o.state.state = 'insert';
//    console.log('insert mode');
//  });

  o.append = function(str) {
    send(z, { label : 'insert', value : stringC(str) });
  }
  o.del = function() {
    send(z, MSG('delete'));
    //o.state.zipper.del();
  }
  o.left = function() {
    send(z, MSG('left'));
    //o.state.zipper.left();
  }
  o.right = function() {
    send(z, MSG('right'));
    //o.state.zipper.right();
  }
  o.print = function() {
    if (debug)
      send(z, MSG('print'));
  }


  addLabel(o, 'insert', function(msg) {
    // Handle special characters
    switch (msg.value) {
      case 'SPACE':
        o.append(' ');
        break;
      case 'BACKSPACE':
        o.left();
        o.del();
        break;
      default:
        o.append(msg.value);
    }
  });
  addLabel(o, 'left', function(msg) {
    o.left();
  });
  addLabel(o, 'right', function(msg) {
    o.right();
  });
  addLabel(o, 'delete', function(msg) {
    o.del();
  });
  addLabel(o, 'hide', function(msg) {
    send(elem, MSG('hide'));
  });

//  addLabel(o, 'press', function(msg) {
//    if (o.state.state === 'insert') {
//      switch (msg.value) {
//        case 'ESCAPE':
//          o.state.state = 'command';
//          o.left();
//          console.log('command mode');
//          o.print();
//          break;
//        // TODO make a new zipper?
//        case 'RETURN':
//          o.append('\n');
//          break;
//        case 'SPACE':
//          o.append(' ');
//          break;
//        case 'BACKSPACE':
//          o.left();
//          o.del();
//          o.print();
//          break;
//        default:
//          o.append(msg.value);
//          break;
//      }
//    } else if (o.state.state === 'command') {
//      switch (msg.value) {
//        case 'i':
//          o.state.state = 'insert';
//          console.log('insert mode');
//          break;
//        case 'h':
//          o.left();
//          o.print();
//          break;
//        case 'l':
//          o.right();
//          o.print();
//          break;
//        case 'x':
//          o.del();
//          o.print();
//          break;
//        case 'u':
//
//          break;
//      }
//    }
//  });

  // Moveable cursor
  makeLineCursorPosition(o, r);

}

worldManager = function(name) {
  var w = this;
  w.name = name;
  initHandlers(w);
  defaultAdder(w);

  var z = new zipper(name+'_zipper');
  var coord = new point(name+'_point');
  var col = new intNum(name+'_col');

  var c_mode = 'command';
  var i_mode = 'insert';


  w.state = {};
  w.state.count = 0;
  w.state.zipper = z;
  w.state.coord = coord;
  w.state.state = 'command';

  w.newLine = function() {
    var name = _.uniqueId();
    var line = new lineEditor(name);

    send(z, { label : 'insert', value : line });
  };

  w.hideCursor = function() {
    var line = z.current();
    if (line)
      send(z.current().state.cursor, MSG('hide'));
  }
  w.showCursor = function() {
    var line = z.current();
    if (line)
      send(z.current().state.cursor, MSG('show'));
  }

  w.up = function() {
    w.hideCursor();
    send(z, MSG('left'));
    w.showCursor();
  }
  w.down = function() {
    w.hideCursor();
    send(z, MSG('right'));
    w.showCursor();
  }
  w.del = function() {
    var line = z.current();
    if (line) {
      send(line.state.cursor, MSG('hide'));
      send(line, MSG('hide'));
    }
    send(z, MSG('delete'));
    w.showCursor();
  }
  w.newLineCombo = function() {
    w.down();
    w.newLine();
    w.up();
    w.state.state = i_mode;
  }

  addLabel(w, 'press', function(msg) {
    var line = z.current();
    if (w.state.state === i_mode) {
      switch (msg.value) {
        case 'RETURN':
          w.newLineCombo();
          break;
        case 'ESCAPE':
          w.state.state = c_mode;
          if (line)
            send(line, MSG('left'));
          break;
        default:
          if (line)
            send(line, { label : 'insert', value : msg.value });
      }
    } else if (w.state.state === c_mode) {
      switch (msg.value) {
        case 'o':
          w.newLineCombo()
          break;
        case 'd':
          w.del();
          break;
        case 'i':
          w.state.state = i_mode;
          break;
        case 'x':
          send(line, MSG('delete'));
          break;
        case 'h':
          send(line, MSG('left'));
          break;
        case 'l':
          send(line, MSG('right'));
          break;
        case 'k':
          w.up();
          break;
        case 'j':
          w.down();
          break;
      }
    } else { console.log("ERROR NO STATE"); }
  });

  addLabel(w, 'hide', function(msg) {
    var l = z.toList();
    w.hideCursor();
    _.each(l, function(line) { send(line, MSG('hide')) });
  });


  // Position lines
  var lineMover = new object(name+'_lineMover');
  addLabel(lineMover, 'set', function(msg) {
    var offset =  40;
    var bottom = svg.node().clientHeight;
    var len = msg.value.length;
    _.each(msg.value, function(line, index) {
      var pos = bottom - (len - index) * charHeight;
      send(line.state.elem.state.coord, set({x:0, y : pos}));
      //send(line.state.elem.state.coord, set({x:0, y : offset + index*charHeight}));
//      send(line, { label : 'coord'
//                 , value : { x : 0, y : offset + index * charHeight }});
    });
  });

  createMap(zipperListMap(z), z, lineMover);


  addLabel(w, 'new-line', function(msg) {
    w.newLine();
  });

  send(w, MSG('new-line'));
  w.up();
}

replayObj = function(name, log, mapper, obj) {
  var r = this;
  r.name = name;
  initHandlers(r);
  defaultAdder(r);

  log.reverse();

  r.state = {};
  r.state.log = log;

  addLabel(r, 'step', function(msg) {
    var entry = log.pop();
    if (entry) {
      var msg = mapper(entry);

      send(obj, msg);
    }
  });
}

runReplay = function(log, mapper, obj) {
  log.reverse();
  while (entry = log.pop()) {
    send(obj, mapper(entry));
  }
}
keyMapper = function(key) {
  return { label : 'press', value : key };
}
keyReplay = function(log, obj) {
  var name = _.uniqueId();
  return new replayObj(name, log, keyMapper, obj);
}

bindReplay = function(replay, keys) {
  var obj = new object('key-obj');
  addLabel(obj, 'press', function(msg) {
    send(replay, MSG('step'));
  });

  addKeyBinding(obj, keys, []);
}

makeWorldTest = function(keys) {


        var world = new worldManager();
        var keyMap = [];
        addKeyBinding(world, keys, keyMap);
  return world;
}

makeLineTest = function(keys) {

  var line = new lineEditor('line');
  var keyMap = [];
  addKeyBinding(line, keys, keyMap);

  var p = new point('p');
  line.coord(p);

  var te1 = new textElem('te1');
  var te2 = new textElem('te2');
  var vb1 = new vblock('vb1', line, te1);

  send(p, set({ x : 40, y : 40}));
  send(te1.state.string, set('hello'));

  return line;
}

makeReplayTest = function(keys) {
  var log = demoLog();

  var w1 = new worldManager();
  runReplay(log, keyMapper, w1);

  var obj = new object();
  var notstarted = true;

  addLabel(obj, 'press', function(msg) {
    switch (msg.value) {
      case 's':
      case 'S':
        if (notstarted) {
          notstarted = false;
          send(w1, MSG('hide'));

          log = demoLog();
          var world = new worldManager();
          bindReplay(keyReplay(log, world), keys);
        }
        break;
    }
  });
  addKeyBinding(obj, keys, []);
}
