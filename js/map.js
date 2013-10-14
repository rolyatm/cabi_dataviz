var map = new L.Map("map", {
		center: [38.89,-77.03],
		zoom: 12,
		maxZoom: 17, 
		minZoom: 12,
		maxBounds : [[38.75,-77.33],[39.03,-76.73]]
	})
	.addLayer( new L.TileLayer("http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png"));

map._initPathRoot();

var svg = d3.select("#map").select("svg"),
	g = svg.append("g").attr("class", "leaflet-zoom-hide"),
	gRoutes = g.append("g").attr("id", "routes"),
	gStations = g.append("g").attr("id", "stations");

d3.json("data/cabi_stations_2012.geojson", function(collection) {
	console.log(collection);
	var path = d3.geo.path().projection(project);

	var feature = gStations.selectAll("circle")
		.data(collection.features)
		.enter().append("circle")
		.attr("cx", function(d) { return project(d.geometry.coordinates)[0] })
		.attr("cy", function(d) { return project(d.geometry.coordinates)[1] })
		.attr("r", 5)
		.attr("id", "stationNode");

	//popup
	feature.on("mousedown",function(d){
  		var coordinates = d3.mouse(this);
		console.log(d,coordinates,map.layerPointToLatLng(coordinates))
 		L.popup().setLatLng(map.layerPointToLatLng(coordinates))
           .setContent("<b>" + d.properties.ADDRESS + "</b> is station number " + d.properties.TERMINAL_N)
           .openOn(map);
		});

	feature.on("mouseover",function(d){
        d3.select(this).style("cursor", "pointer")
        .transition().duration(500).attr("r", 10);
	}); 
	feature.on("mouseout",function(d){
        d3.select(this).transition().duration(500).attr("r", 5);
	}); 

	map.on("viewreset", reset); 
	
	function reset() {
		feature.attr("cx", function(d) { return project(d.geometry.coordinates)[0] })
			.attr("cy", function(d) { return project(d.geometry.coordinates)[1] })
			.attr("r", 5)
	}
});


function project(x) {
	var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
	return [point.x, point.y];
}