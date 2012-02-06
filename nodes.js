/*
    Nodes – Arko's Experiment with HTML5 canvas element
    Author: Loïc Cattani (Arko) <loic.cattani@gmail.com>
    Date: December 2010
*/

var canvas;
var context;
var mouse = { x: 0, y: 0, down: false };
var mouseDownTime = 0;
var framerate = 60;
var intervalId; // Will hold the loop reference

function initialize() {
  
  // Get the canvas element
  canvas = document.getElementById('world');
  
  if (canvas && canvas.getContext) {
    
    // Get 2D context
    context = canvas.getContext('2d');
    
    // Register Event Listeners
    document.addEventListener('mousedown', mouseDown, false);
    document.addEventListener('mouseup', mouseUp, false);
    canvas.addEventListener('mousemove', mouseMove, false);
    document.addEventListener('keydown', keyDown, false);
    document.addEventListener('keyup', keyUp, false);
    window.addEventListener('resize', centerCanvas, false);
    
    // Initiate Nodes World
    NodesWorld.initialize();
    
    // Override canvas CSS positioning and center canvas on screen
    centerCanvas();
    
    // Initiate the loop
    start();
  }
}

// Event handler for mouseDown
function mouseDown() {
  mouse.down = true;
  mouseMove();
  mouseDownTime = (new Date).getTime();
  sw = new ShockWave(mouse.x, mouse.y, 0);
  NodesWorld.shock_waves.push(sw);
}

// Event handler for mouseUp
function mouseUp() {
  mouse.down = false;
  mouseMove();
  NodesWorld.shock_waves[NodesWorld.shock_waves.length-1].blast();
}

// Event handler for mouseMove
function mouseMove() {
  mouse.x = event.clientX - (window.innerWidth - canvas.width) / 2;
  mouse.y = event.clientY - (window.innerHeight - canvas.height) / 2;
}

// Event handler for keyDown
function keyDown(event) {
  switch(event.keyCode){
    case 80: // "p" for pause
      toggleLoop();
      event.preventDefault();
      break;
    case 83: // "s" for shockwave
      NodesWorld.blast();
      event.preventDefault();
      break;
  }
  //console.log("KeyCode: " + event.keyCode)
}

// Event handler for keyUp
function keyUp() {
}

// Center the canvas in the window's body
//   (Needed for mouse position to be accurate)
function centerCanvas() {
  canvas.style.position = 'absolute';
  canvas.style.top = Math.round((window.innerHeight - canvas.height - 12) / 2) + 'px'; // 12 = 2 * 6 pixels border
  canvas.style.left = Math.round((window.innerWidth - canvas.width - 12) / 2) + 'px';
}

// Initiate the loop
function start() {
  intervalId = setInterval(loop, 1000/framerate);
}

// Clear the loop
function pause() {
  clearInterval(intervalId);
  intervalId = null;
}

// Toggle loop interval
function toggleLoop() {
  (intervalId) ? pause() : start();
}

// The loop
function loop() {
  NodesWorld.update();
  NodesWorld.draw();
  stats.update();
}

var NodesWorld = new function () {
  // Physics
  this.boundaries = { x: 0, y: 0, width: 940, height: 660 };
  this.drag = 0.002; // Good val: 0.002
  this.gravity = { force: 0.0, direction: Math.PI/2 }; // Good force: 0.2 Direction: Math.PI/2 rad => 90° from +x axis CW
  
  // Content
  this.node_count = 10000;
  this.nodes = new Array();
  this.shock_waves = new Array();
  
  this.initialize = function() {
    // Transform gravity to a force vector
    this.gravity = new Vector(this.gravity.force, this.gravity.direction);
  
    // Fill world with randomly positionned nodes
    for (var i = this.node_count - 1; i >= 0; i--){
      node = new Node(Math.random() * (this.boundaries.width-1), Math.random() * (this.boundaries.height-1));
      this.nodes.push(node);
    }
  }
  
  // Update world's objects
  this.update = function () {
    // Update nodes
    for( var i = 0, len = this.nodes.length; i < len; i++ ) {
      node = this.nodes[i];
      node.update(this.drag, this.gravity);
    }
    
    // Update ShockWaves
    for( var i = 0, len = this.shock_waves.length; i < len; i++ ) {
      sw = this.shock_waves[i];
      if (sw) // If shockwave still exists, either update it or remove it from array if alpha == 0
        (sw.color.a == 0) ? this.shock_waves.splice(i,1) : sw.update();
    }
  }
  
  // Draw world
  this.draw = function () {
    
    // Clear world
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = "rgba(0,0,0,1)";
    context.fillRect(this.boundaries.x, this.boundaries.y, this.boundaries.width, this.boundaries.height);
    // context.globalCompositeOperation = 'lighter';
    
    // Draw nodes
    for( var i = 0, len = this.nodes.length; i < len; i++ ) {
      node = this.nodes[i];
      context.fillStyle = node.fillcolor;
      context.fillRect( node.x, node.y, node.size, node.size );
    }
    
    // Draw shockwaves
    for( var i = 0, len = this.shock_waves.length; i < len; i++ ) {
      sw = this.shock_waves[i];
      context.beginPath();
      context.arc( sw.x, sw.y, sw.outer_radius, 0, Math.PI*2, true );
      context.fillStyle = sw.outer_fillcolor,
      context.fill();
      context.beginPath();
      context.arc( sw.x, sw.y, sw.inner_radius, 0, Math.PI*2, true );
      context.fillStyle = sw.inner_fillcolor;
      context.strokeStyle = sw.inner_strokecolor;
      context.fill();
      context.stroke();
    }
  }
  
  // Blast away all nodes close to the mouse position
  this.blast = function (magnitude) {
    sw = new ShockWave(mouse.x, mouse.y);
    sw.magnitude = magnitude || 800;
    this.shock_waves.push(sw);
    NodesWorld.shock_waves[NodesWorld.shock_waves.length-1].blast();
  }
}

/* Defines a point in a 2D space */
function Point (x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

/* Returns the distance between this and a given point */
Point.prototype.distanceTo = function (point) {
  a = point.x - this.x;
  b = point.y - this.y;
  return Math.sqrt(a*a + b*b);
}

/* Returns the angle between this and a given point */
Point.prototype.angleTo = function (point) {
  x = point.x - this.x;
  y = point.y - this.y;
  return Math.atan2(y, x);
}

/* Defines a vector in a 2D space */
function Vector (m, a) {
  this.magnitude = m || 0;
  this.angle = a || 0;
  this.x = 0;
  this.y = 0;
  this.updateXY();
}

Vector.prototype.setX = function (x) {
  this.x = x || 0;
  this.updateMA();
}

Vector.prototype.setY = function (y) {
  this.y = y || 0;
  this.updateMA();
}

Vector.prototype.setMagnitude = function (m) {
  this.magnitude = m || 0;
  this.updateXY();
}

Vector.prototype.setAngle = function (a) {
  this.angle = a || 0;
  this.updateXY();
}

Vector.prototype.updateMA = function () {
  x = this.x;
  y = this.y;
  this.magnitude = Math.sqrt(x*x + y*y);
  this.angle = Math.atan2(y,x);
}

Vector.prototype.updateXY = function () {
  this.x = this.magnitude * Math.cos(this.angle);
  this.y = this.magnitude * Math.sin(this.angle);
}

/* Defines a node */
Node.prototype = new Point;
Node.prototype.constructor = Node;
function Node (x, y) {
  Point.call(this, x, y);
  this.velocity = new Vector();
  this.mass = 10; // Can't be 0!
  this.bounce_damp = 0.6;
  this.size = 1;
  this.color = { r: 255, g: 255, b: 255, a: 1};
  this.fillcolor = 'rgba('+this.color.r+','+this.color.g+','+this.color.b+',0.5)';
  this.strokecolor = 'rgba('+this.color.r+','+this.color.g+','+this.color.b+',1)';
}

/* Update a node's position, optionally applying a drag and a force */
Node.prototype.update = function (d, f) {
  this.drag(d);
  //this.applyForce(f);
  this.x += this.velocity.x;
  this.y += this.velocity.y;
  this.checkCollisions();
}

/* Apply the given drag as a coefficient */
Node.prototype.drag = function (d) {
  d = d || 0;
  this.velocity.x = this.velocity.x * ( 1 - d )
  this.velocity.y = this.velocity.y * ( 1 - d )
}

/* Apply the given force as a vector */
Node.prototype.applyForce = function (f) {
  f = f || new Vector();
  this.velocity.x = this.velocity.x + f.x / this.mass;
  this.velocity.y = this.velocity.y + f.y / this.mass;
}

/* Returns the speed in pixels per time interval */
Node.prototype.speed = function () {
  return this.velocity.magnitude;
}

/* Check World's Boundaries Collisions */
Node.prototype.checkCollisions = function () {
  bx = NodesWorld.boundaries.x;
  bw = NodesWorld.boundaries.width - this.size;
  by = NodesWorld.boundaries.y;
  bh = NodesWorld.boundaries.height - this.size;
  
  // Check if the node's position is outside the x-axis boundaries
  if (this.x < bx || this.x > bw) {
    // Reverse and damp x velocity
    this.velocity.x = (this.velocity.x * -this.bounce_damp);
    // Damp y velocity
    this.velocity.y = (this.velocity.y * this.bounce_damp);
    // Reposition the node in the x axis minus the damp effect
    if (this.x < bx)
      this.x += (1 + this.bounce_damp) * (bx - this.x)
    if (this.x > bw)
      this.x += (1 + this.bounce_damp) * (bw - this.x)
  }
  
  // Check if the node's position is outside the y-axis boundaries
  if (this.y < by || this.y > bh) {
    // Reverse and damp y velocity
    this.velocity.y = (this.velocity.y * -this.bounce_damp);
    // Damp x velocity
    this.velocity.x = (this.velocity.x * this.bounce_damp);
    // Reposition the node in the y axis minus the damp effect
    if (this.y < by)
      this.y += (1 + this.bounce_damp) * (by - this.y)
    if (this.y > bh)
      this.y += (1 + this.bounce_damp) * (bh - this.y)
  }
}

/* Defines a shock wave */
ShockWave.prototype = new Point;
ShockWave.prototype.constructor = ShockWave;
function ShockWave (x, y) {
  Point.call(this, x, y);
  this.magnitude = 0;
  this.inner_radius = 20;
  this.outer_radius = 60;
  this.color = randomColor();
  this.inner_fillcolor = 'rgba(255,255,255,0.1)';
  this.inner_strokecolor = 'rgba(255,255,255,0.8)';
  this.outer_fillcolor = 'rgba(255,255,255,0)';
  this.growing = 1;

}

/* Update the shock wave */
ShockWave.prototype.update = function () {
  if (this.growing) {
    now = (new Date).getTime();
    this.magnitude = ((now - mouseDownTime) / 1000) * 800;
    this.inner_radius = this.magnitude / 10
  } else {
    this.inner_radius += (this.magnitude / 10 - this.inner_radius)/5
    this.outer_radius += (this.magnitude / 3.2 - this.outer_radius)/8
    this.color.a -= (this.color.a/10)
    this.inner_fillcolor = 'rgba(255,255,255,'+this.color.a/4+')';
    this.inner_strokecolor = 'rgba(255,255,255,'+this.color.a+')';
    this.outer_fillcolor = 'rgba('+this.color.r+','+this.color.g+','+this.color.b+','+this.color.a/3+')';
    if (this.color.a < 0.02)
      this.color.a = 0;
  };
}

ShockWave.prototype.blast = function () {
  this.growing = 0;
  this.inner_radius = this.magnitude / 40;
  this.outer_radius = this.magnitude / 12;
  
  /* Trigger the shock wave */
  for( var i = 0, len = NodesWorld.nodes.length; i < len; i++ ) {
    node = NodesWorld.nodes[i];
    d = this.distanceTo(node);
    m = this.magnitude * 1/d;
    a = this.angleTo(node);
    f = new Vector(m, a);
    node.applyForce(f);
  }
}

function randomColor() {
  return {r: Math.round(Math.random()*255), g: Math.round(Math.random()*255), b: Math.round(Math.random()*255), a: 1};
}

initialize();
