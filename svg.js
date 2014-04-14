var svg;
var referenceCount = 0;
var charWidth;
var charHeight;

//
// id stuff
//
newObjId = function() {
  var id = referenceCount;
  referenceCount += 1;
  return id;
}
getElementId = function(thing) {
  return getAttr(thing, "reference");
}
getAttr = function(thing, attr) {
  return +thing.getAttribute(attr);
}

selectId = function(selector, id) {
  return d3.selectAll(selector).filter(function(){ return getElementId(this) === id;});
}

//
// Create SVG element
//
initSVG = function() {
  svg = d3.select("body")
    .style("width", "100%")
    .style("height", "100%")
    .style("margin", "0")
    .append("div")
    .attr("class", "body")
    // make focusable
    .attr("tabindex", 1)
    .append("svg")
    .attr("class", "chart")
    .attr("width", "98%")
    .attr("height", "98%")
    ;

  // Measure text dimensions
  d3.select(".chart").append("text")
    .text("k")
    .attr("class", "text-obj")
    .attr("id", "m")
    .attr("font-family", "monospace")
    ;
  d3.selectAll("#m").each(function() {
    var box = this.getBBox();
    charWidth = box.width;
    charHeight = box.height;
  });
  d3.selectAll("#m").remove();
}

//
// SVG element creation using d3
//
addText = function(str, x, y) {
  var id = newObjId();
  var elem = svg.append("text")
    .text(str)
    .attr("class", "text-obj")
    //.attr("font-family", "monospace")
    //.attr("font-size", 40)
    .attr("text-anchor", "left")
    .attr("x", x)
    .attr("y", y)
    .attr("reference", id)
    ;
  return { id : id, elem : elem };
}

addRect = function(x, y, w, h) {
  var id = newObjId();
  var elem = svg.append("rect")
    .attr("class", "rect-obj")
    .attr("x", x)
    .attr("y", y)
    .attr("width", w)
    .attr("height", h)
    .attr("reference", id)
    ;
  return { id : id, elem : elem };
}
addPoint = function(x, y) {
  var id = newObjId();
  var radius = 3;
  svg.append("circle")
    .attr("class", "point")
    .attr("cx", x)
    .attr("cy", y)
    .attr("r", radius)
    .attr("reference", id)
    ;
//  svg.append("circle")
//    .attr("class", "point-cover")
//    .attr("cx", x)
//    .attr("cy", y)
//    .attr("r", 3.5*radius)
//    .attr("reference", id)
//    .on("click", clickHandler)
//    .on("mouseover", hoverHandler)
//    .on("mouseout", hoverOutHandler)
//    .on("mousedown", mouseDownHandler)
//    .on("mouseup", mouseUpHandler)
//    ;
  return id;
}

addLine = function(p1, p2) {
  var id = newObjId();
  svg.append("path")
    .attr("d", dLine(p1, p2))
    .attr("class", "arrow")
    .attr("marker-end", "url(#arrow-mark)")
    .attr("reference", id)
    ;
  return id;
}
