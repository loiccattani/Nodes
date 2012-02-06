// Stats.js JavaScript Performance Monitor
// https://github.com/mrdoob/stats.js

var stats = new Stats();

// Align top-left
stats.getDomElement().style.position = 'absolute';
stats.getDomElement().style.left = '0px';
stats.getDomElement().style.top = '0px';

document.body.appendChild( stats.getDomElement() );
