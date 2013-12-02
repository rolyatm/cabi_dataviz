//add <p>Directions Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png"></p>
var map = new L.Map("map", {
  center: [38.89,-77.03],
  zoom: 12,
  maxZoom: 15, 
  minZoom: 12
  //maxBounds : [[38.75,-77.33],[39.03,-76.73]]
})
.addLayer( new L.TileLayer("http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png", {opacity: 0.5}));

map._initPathRoot();

var svg = d3.select("#map").select("svg"),
  g = svg.append("g").attr("class", "leaflet-zoom-hide"),
  gRoutes = g.append("g").attr("id", "routes"),
  gStations = g.append("g").attr("id", "stations");

d3.json("data/cabi_stations_2012.geojson", function(collection) {
  var feature = gStations.selectAll("circle")
    .data(collection.features)
    .enter().append("circle")
    .attr("cx", function(d) { return project(d.geometry.coordinates)[0] })
    .attr("cy", function(d) { return project(d.geometry.coordinates)[1] })
    .attr("r", radiusScale(.05))
    .attr("id", "stationNode");

//popup
feature.on("mousedown",function(d){
  var coordinates = d3.mouse(this);
  var station = d.properties.TERMINAL_N;
  d3.select("#station_details").html("<b>" + d.properties.ADDRESS + "</b> is station number " + d.properties.TERMINAL_N); 		
  //L.popup().setLatLng(map.layerPointToLatLng(coordinates))
  //  .setContent("<b>" + d.properties.ADDRESS + "</b> is station number " + d.properties.TERMINAL_N)
  //  .openOn(map);
  showRoutes(station);
});

feature.on("mouseover",function(d){
  d3.select("#station_details").html(d.properties.ADDRESS);        	
  d3.select(this).style("cursor", "pointer")
    .transition().duration(500).attr("r", radiusScale(.1));
}); 
feature.on("mouseout",function(d){
  d3.select(this).transition().duration(500).attr("r", radiusScale(.05));
}); 

map.on("viewreset", reset); 

function reset() {
  feature.attr("cx", function(d) { return project(d.geometry.coordinates)[0] })
    .attr("cy", function(d) { return project(d.geometry.coordinates)[1] })
    .attr("r", radiusScale(.05));
  }
});

function showRoutes(station) {
  gRoutes.selectAll("path").data([]).exit().remove();
  d3.json("php/data.php?station=" + station, function(collection) {
    console.log(collection)
    var path = d3.geo.path().projection(project);
    var feature = gRoutes.selectAll("path")
      .data(collection.features)
      .enter().append("path")
      .attr("d", path)
      .attr("class", "route")
      .style("stroke-width", function(d) { return (d.properties.count/365 < 1 ? 0.5 : Math.ceil(d.properties.count/180))});
      //add a filter to dim all stations that are not connected. 
      //d3.select(gStations).filter(
    
      
      
    map.on("viewreset", reset);

    function reset() {
      feature.attr("d", path);
    }
  });  
}

function project(x) {
  var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
  return [point.x, point.y];
}

function radiusScale(r) {
  return r*Math.pow(2, (map.getZoom()/2));
}
