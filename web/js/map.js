//add <p>Directions Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png"></p>
var stationSelected = false;

L.CRS.CustomZoom = L.extend({}, L.CRS.EPSG3857, {
  scale: function (zoom) {
    return 256 * Math.pow(1.5, zoom);
  }
});

var map = new L.Map("map", {
  center: [38.89,-77.03],
  zoom: 12,
  //zoomControl: false,
  maxZoom: 14, 
  minZoom: 12,
  //maxBounds : [[38.75,-77.33],[39.03,-76.73]]
})
//.fitBounds([[38.84,-77.12],[38.948,-76.93]])
//map.options.crs = L.CRS.EPSG3857;
.addLayer( new L.TileLayer("http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png", {opacity: 0.3}));

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
    .attr("class", "stationNode");

//popup
feature.on("mousedown",function(d){
  var coordinates = d3.mouse(this);
  var station = d.properties.TERMINAL_N;
  stationSelected = true;
  d3.selectAll(".stationNode").style("fill","B6B6B6").transition().duration(500).attr("r", radiusScale(.05));
  d3.select("#station_details").html("Station: " + d.properties.ADDRESS); 		
  //L.popup().setLatLng(map.layerPointToLatLng(coordinates))
  //  .setContent("<b>" + d.properties.ADDRESS + "</b> is station number " + d.properties.TERMINAL_N)
  //  .openOn(map);
  d3.select(this).style("fill", "FFCB00").transition().duration(500).attr("r", radiusScale(.1));
  showRoutes(station);
});

feature.on("mouseover",function(d){
  if (stationSelected) {
    d3.select("#other_station").html("Station: " + d.properties.ADDRESS);
  } else { 
    d3.select("#station_details").html("Station: " + d.properties.ADDRESS);        	
  }
  d3.select(this).style("cursor", "pointer")
    .transition().duration(100).style("stroke-width", 1.5);
}); 
feature.on("mouseout",function(d){
  d3.select(this).transition().duration(100).style("stroke-width", .5);
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
    //console.log(collection);
    var path = d3.geo.path().projection(project);
    var feature = gRoutes.selectAll("path")
      .data(collection.features)
      .enter().append("path")
      .attr("d", path)
      .attr("class", "route")
      .style("stroke-width", function(d) { return (d.properties.count/365 < 1 ? 0.5 : Math.ceil(d.properties.count/180))});
      //add a filter to dim all stations that are not connected. 
      //d3.select(gStations).filter(
    feature.each(function(d, i) {
      var toStation = d.properties.to;
      //console.log (d3.select("#stations").selectAll("circle"));
      d3.select("#stations").selectAll("circle").filter(function(d) {
        //console.log (d);
        return d.properties.TERMINAL_N == toStation;
      }).style("fill", "FFCB00");      
    });
      
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
