//albion2dcode
var angle = 0
var gameToMapPoint = function (point) {
return [gameToMapX(point[0], point[1]), gameToMapY(point[0], point[1])]
}

var gameToMapX = function (x, z) {
return ((z * Math.cos(angle) + x * Math.sin(angle)) / 800) * 256 - 128
}

var gameToMapY = function (x, z) {
return ((-z * Math.sin(angle) + x * Math.cos(angle)) / 800) * 256 + 128
}

var coords = [gameToMapX(0, 0), gameToMapY(0, 0)]
var zoom = 2
var _radius = 1;
if (coords.length >= 3) {
    zoom = coords[2]
}

var map = L.map('map', {
    zoomSnap: 0.25,
    zoomControl: false,
    crs: L.CRS.Simple,
    center: coords,
})

var tileLayer = L.tileLayer('https://cdn.albiononline2d.com/map/maptiles/{z}/map_{x}_{y}.png', {
    minZoom: 1,
    maxZoom: 7,
    noWrap: true,
});
map.addLayer(tileLayer);

map.setView(new L.LatLng(-165, 133), 3, { animation: true })
// ----