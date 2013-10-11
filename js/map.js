var map = new L.Map("map")
	.setView( new L.LatLng(38.89,-77.03), 12)
	.addLayer( new L.TileLayer("http://{s}.tile.cloudmade.com/3eb45b95929d472d8fe4a2a5dafbd314/998/256/{z}/{x}/{y}.png"));

map._initPathRoot();

var svg = d3.select("#map").select("svg"),
	g = svg.append("g");

var path = d3.geo.path().projection(function project(x) {
	var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
	return [point.x, point.y];
});
d3.json("data/cabi_stations_2012.geojson", function(collection) {
	var feature = g.selectAll("path")
	.data(collection.features)
	.enter().append("path")
	.attr("d", path);

	map.on("viewreset", function reset() {
		feature.attr("d", path)
	})
});