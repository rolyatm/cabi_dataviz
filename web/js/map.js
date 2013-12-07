//add <p>Directions Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png"></p>
//add time rings around each station
var stationSelected = 0;

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
.addLayer( new L.TileLayer("http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png", {opacity: 0.2}));

map._initPathRoot();

var svg = d3.select("#map").select("svg"),
  g = svg.append("g").attr("class", "leaflet-zoom-hide"),
  gRoutes = g.append("g").attr("id", "routes").attr("filter","url(#f1)"),
  gStations = g.append("g").attr("id", "stations");

svg.select(function() { return this.appendChild(document.getElementById("filter"))});
d3.json("data/cabi_stations_2012.geojson", function(collection) {
  var feature = gStations.selectAll("circle")
    .data(collection.features)
    .enter().append("circle")
    .attr("cx", function(d) { return project(d.geometry.coordinates)[0] })
    .attr("cy", function(d) { return project(d.geometry.coordinates)[1] })
    .attr("r", radiusScale(.05))
    .attr("class", "stationNode sn_unselected");
    console.log(feature);

//popup
feature.on("mousedown",function(d){
  var coordinates = d3.mouse(this);
  //checks to see if user click is on a new origin node or a shift+click to select an end
  if (d3.event.shiftKey) {
    d3.select(this).attr("class", "stationNode sn_end_selected").style("fill-opacity", "1");
    d3.selectAll(".sn_end").style("fill-opacity", ".25");
    d3.selectAll(".sn_unselected").style("fill-opacity", ".25");

    showRoutes(stationSelected, d.properties.TERMINAL_N);
    
  }
  else {
    stationSelected = d.properties.TERMINAL_N;
    d3.selectAll(".stationNode").attr("class", "stationNode sn_unselected").style("fill","B6B6B6").style("fill-opacity", "1").transition().duration(500).attr("r", radiusScale(.05));
    d3.select("#station_details").html("Origin: " + d.properties.ADDRESS); 		
    d3.select(this).attr("class", "stationNode sn_selected").style("fill", "FFCB00").transition().duration(500).attr("r", radiusScale(.1));
    showRoutes(stationSelected);
  }
});

feature.on("mouseover",function(d){
  if (stationSelected > 0) {
    d3.select("#other_station").html("Destination: " + d.properties.ADDRESS);
  } else { 
    d3.select("#station_details").html("Origin: " + d.properties.ADDRESS);        	
  }
  d3.select(this).style("cursor", "pointer")
    .transition().duration(100).style("stroke-width", 1.5);

  //L.popup().setLatLng(map.layerPointToLatLng(coordinates))
    //  .setContent("<b>" + d.properties.ADDRESS + "</b> is station number " + d.properties.TERMINAL_N)
    //  .openOn(map);
}); 

feature.on("mouseout",function(d){
  d3.select(this).transition().duration(100).style("stroke-width", .5);
}); 

map.on("viewreset", reset); 

function reset() {
  feature.attr("cx", function(d) { return project(d.geometry.coordinates)[0] })
    .attr("cy", function(d) { return project(d.geometry.coordinates)[1] })
    .attr(function() {
      if (this.id = "sn_selected") {return "r", radiusScale(.1)}
      else {return "r", radiusScale(.05)}
    });
}
});

function showRoutes(from_station, to_station) {
  gRoutes.selectAll("path").data([]).exit().remove();
  if(!to_station) {
    to_station = 0;
  }
  d3.json("php/data.php?os=" + from_station + "&ds=" + to_station, function(collection) {
    //console.log(collection);
    var path = d3.geo.path().projection(project);
    var feature = gRoutes.selectAll("path")
      .data(collection.features)
      .enter().append("path")
      .attr("d", path)
      .attr("class", "route")
      .style("stroke-width", function(d) { return (d.properties.count/365 < 1 ? 0.5 : Math.ceil(d.properties.count/180))});
    //step through each route and determines the "to" station and then filters the station nodes that match and highlights
    feature.each(function(d, i) {
      var toStation = d.properties.to;
      d3.select("#stations").selectAll("circle").filter(function(d) {
        return d.properties.TERMINAL_N == toStation;
      }).style("fill", "FFCB00").attr("class","stationNode sn_end");      
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
