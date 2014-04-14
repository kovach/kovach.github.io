makeKeyTest = function(keys) {
  // Keyboard test
  var term = new termObject('term');

  var keyMap = [];
  addKeyBinding(term, keys, keyMap);
}
showLog = function(keys) {
  window.open("data:text/json;charset=utf-8,"+JSON.stringify(keys.state.log))
}

//makeKeyTest(keys);

var keys = initKeyboard();
//var line = makeLineTest(keys);
//var w = makeWorldTest(keys);
var r = makeReplayTest(keys);
