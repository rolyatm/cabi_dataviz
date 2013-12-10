//add <p>Directions Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png"></p>
//add time rings around each station
//animate the bar graph and route drawing
//make bar graph interact with map
var stationSelected = 0
  station2Selected = 0,
  w_graph = window.innerWidth/3.25,
  h_graph = window.innerHeight/1.7,
  stationLUT = {};

L.CRS.CustomZoom = L.extend({}, L.CRS.EPSG3857, {
  scale: function (zoom) {
    return 256 * Math.pow(1.5, zoom);
  }
});


var map = new L.Map("map", {
  center: [38.89,-77.03],
  zoom: 13,
  //zoomControl: false,
  maxZoom: 14, 
  minZoom: 12,
  zoomControl: false
})

.addLayer( new L.TileLayer("http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png", {opacity: 0.2}));
new L.control.zoom({position: "bottomright"}).addTo(map);

map._initPathRoot();

var svg = d3.select("#map").select("svg"),
  g = svg.append("g").attr("class", "leaflet-zoom-hide"),
  gRoutes = g.append("g").attr("id", "routes").attr("filter","url(#f1)"),
  gStations = g.append("g").attr("id", "stations"),
  graph = d3.select("#graph").append("svg:svg").attr("width", w_graph).attr("height", h_graph);
  gExtraBars = graph.append("g").attr("id","extrabars");
  gBars = graph.append("g").attr("id", "graphbars");
  gText = graph.append("g").attr("id", "graphtext");
  
  
svg.select(function() { return this.appendChild(document.getElementById("filter"))});
graph.select(function() { return this.appendChild(document.getElementById("filter"))});
d3.json("data/cabi_stations_2012.geojson", function(collection) {
  var sfeature = gStations.selectAll("circle")
    .data(collection.features)
    .enter().append("circle")
    .attr("cx", function(d) { return project(d.geometry.coordinates)[0] })
    .attr("cy", function(d) { return project(d.geometry.coordinates)[1] })
    .attr("r", radiusScale(.05))
    .attr("class", "stationNode sn_unselected");

    //create station lookup table for easy reference
    sfeature.each(function(d) {
      stationLUT[d.properties.TERMINAL_N] = [d.properties.ADDRESS.slice(0,d.properties.ADDRESS.search(/\[/) == -1 ? d.properties.ADDRESS.length : d.properties.ADDRESS.search(/\[/)), d.geometry.coordinates[0], d.geometry.coordinates[1]];
    });
    
    //interactivity
    sfeature.on("mousedown",function(d){
      var coordinates = d3.mouse(this);
      //checks to see if user click is on a new origin node or a shift+click to select an end
      if (d3.event.shiftKey) {
        if (stationSelected != 0) {
          station2Selected = d.properties.TERMINAL_N;
          d3.select(this).attr("class", "stationNode sn_end_selected").style("fill-opacity", "1");
          d3.selectAll(".sn_end").style("fill-opacity", ".25");
          d3.selectAll(".sn_unselected").style("fill-opacity", ".25"); 
          showRoutes(stationSelected, d.properties.TERMINAL_N);
          showPopup(stationLUT[stationSelected], stationLUT[d.properties.TERMINAL_N]);
        }    
      }
      else {
        d3.select("#graphtext").selectAll("text").data([]).exit().remove();
        graph.selectAll("rect").data([]).exit().remove();
        stationSelected = d.properties.TERMINAL_N;
        station2Selected = 0;
        d3.selectAll(".stationNode").attr("class", "stationNode sn_unselected").style("fill","#B6B6B6").style("fill-opacity", "1").transition().duration(500).attr("r", radiusScale(.05));
        d3.select("#origin").html("Station: " + stationLUT[stationSelected][0]); 		
        d3.select(this).attr("class", "stationNode sn_selected").style("fill", "#FFCB00").transition().duration(500).attr("r", radiusScale(.1));
        showRoutes(stationSelected);
      }
    });
    sfeature.on("mouseover", function(d){
      d3.select(this).style("cursor", "pointer")
        .transition().duration(100).style("stroke-width", "1.5px");
      add_map_label(d);
      if (stationSelected == 0) { 
        d3.select("#origin").html("Station: " + stationLUT[d.properties.TERMINAL_N][0]);        	
      }
    }); 
    sfeature.on("mouseout",function(d){
      d3.select(this).transition().duration(100).style("stroke-width", ".5px");
      remove_map_label();
    }); 
    map.on("viewreset", reset); 
    
    function reset() {
      sfeature.attr("cx", function(d) { return project(d.geometry.coordinates)[0]; })
      .attr("cy", function(d) { return project(d.geometry.coordinates)[1]; })
      .attr("r", function(d) {
        if (d.properties.TERMINAL_N == stationSelected) {return radiusScale(.1);}
        else {return radiusScale(.05);}
      });
    }
});

//does all the heavy lifting of querying database and rendering routes
function showRoutes(from_station, to_station) {
  var gData = [];
  gRoutes.selectAll("path").data([]).exit().remove();
  if(!to_station) {
    to_station = 0;
  }
  //call to php page to return routes
  d3.json("php/data.php?os=" + from_station + "&ds=" + to_station, function(collection) {
    var path = d3.geo.path().projection(project);
    var rfeature = gRoutes.selectAll("path")
      .data(collection.features)
      .enter().append("path")
      .attr("d", path)
      .attr("class", "route")
      .style("stroke-width", function(d) { return (d.properties.count/150 < 1 ? "0.5px" : Math.ceil(d.properties.count/150)+"px")});
      //step through each route and determines the "to" station and then filters the station nodes that match and highlights
    rfeature.each(function(d) {
      var toStation = d.properties.to;
      d3.select("#stations").selectAll("circle").filter(function(sd) {return sd.properties.TERMINAL_N == toStation;})
        .style("fill", "#D0C52C").attr("class","stationNode sn_end");
      gData.push([d.properties.to, d.properties.count]);
    });
    var newData =gData.sort(function(a,b){return b[1]-a[1]}).slice(0,20);   
    drawGraph(newData);  
 
    map.on("viewreset", reset);

    function reset() {
      rfeature.attr("d", path);
    }
  });  
}

function drawGraph(gData) {
  d3.selectAll("#graph_header").html("Top 20 Destinations ").append("em").html("(total trips in 2012)");
  var bars = gBars.selectAll("rect")
    .data(gData)
    .enter()
    .append("rect")      
    .attr("x", 5)
    .attr("y", function(d, i){ return i * (h_graph / gData.length) + 2; })
    .attr("width", 0)
    .attr("height", h_graph / 20 - 2)
    .style("fill", "#40301A")
    .style("opacity", "0.5");
    bars.transition().duration(500).attr("width", function(d,i) {  
      //checks to see if the graph is longer than the svg width and draws another rect on top to show the total length
      if (d[1]/2 > w_graph-3){
        var ebars = d3.select("#extrabars").append("rect")
          .attr("x", 5)
          .attr("y", i * (h_graph / gData.length) + 2)
          .attr("width", 0)
          .attr("height", h_graph / 20 - 2)
          .style("fill", "#40301A")
          .style("opacity", "0.5");
        ebars.transition().delay(250).duration(500).attr("width", d[1]/2-(w_graph-3));
        return w_graph-3;
      } else { 
        return d[1]/2;
      }      
    });
  //add interactivity
  bars.on("mouseover",function(d){
    d3.select(this).style("cursor", "pointer");
    d3.select(this).attr("filter","url(#f1)").style("stroke-width", "1px").style("stroke", "#929292");
    var s = d3.select("#stations").selectAll("circle").filter(function(sd) {return sd.properties.TERMINAL_N == d[0];});
    s.transition().duration(500).delay(0).each(c_flash);
    add_map_label(s.data()[0]);
  });
  bars.on("mouseout",function(d){
    d3.select(this).attr("filter","").style("stroke-width", "0px");
    d3.select("#stations").selectAll("circle").filter(function(sd) {return sd.properties.TERMINAL_N == d[0];})
      .transition().duration(500).attr("r", radiusScale(0.05));
    remove_map_label();
  });
  bars.on("mousedown",function(d){
    showRoutes(stationSelected, d[0]);
    showPopup(stationLUT[stationSelected], stationLUT[d[0]]);
  });
  
  //add labels
  var text = gText.selectAll("text")
    .data(gData)
    .enter()
    .append("text")
    .attr("x", 7)
    .attr("y", function(d, i){ return i * (h_graph / gData.length) + ((h_graph / 20)/2+5)})
    .style("font-family", "sans-serif")
    .style("font-size", "10pt")
    .style("fill", "#2B3B1C")
    .style("dominant-baseline", "central")
    //.attr("filter", "url(#f2)")
    .append("tspan").style("font-weight", "bold").text(function(d) {return d[1];})
    .append("tspan").style("font-weight", "normal").text(function(d) {return " - " + stationLUT[d[0]][0];});
  //add interactivity
  text.on("mouseover",function(d){
    d3.select(this).style("cursor", "pointer");
    d3.select("#graphbars").selectAll("rect").filter(function(bd) {return bd[0] == d[0];})
      .attr("filter","url(#f1)").style("stroke-width", "1px").style("stroke", "#929292");
    var s = d3.select("#stations").selectAll("circle").filter(function(sd) {return sd.properties.TERMINAL_N == d[0];});
    s.transition().duration(500).delay(0).each(c_flash);
    add_map_label(s.data()[0]);
  });
  text.on("mouseout",function(d){
    d3.select("#graphbars").selectAll("rect").filter(function(bd) {return bd[0] == d[0];})
      .attr("filter","").style("stroke-width", "0px");
    d3.select("#stations").selectAll("circle").filter(function(sd) {return sd.properties.TERMINAL_N == d[0];})
      .transition().duration(500).attr("r", radiusScale(0.05));
    remove_map_label();
  });
  text.on("mousedown",function(d){
    showRoutes(stationSelected, d[0]); 
    showPopup(stationLUT[stationSelected], stationLUT[d[0]]);
  });
}
//converts screen coords to latlng for leaflet
function project(x) {
  var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
  return [point.x, point.y];
}

//function that scales symbols based on zoom level
function radiusScale(r) {
  return r*Math.pow(2, (map.getZoom()/2));
}

function c_flash() {
  var circle = d3.select(this);
  (function repeat() {
    circle = circle.transition()
        .attr("r", radiusScale(.1))
      .transition()
        .attr("r", radiusScale(0.05))
        .each("start", repeat);
  })();
}

function add_map_label(data) {
  g.append("text")
        .attr("x", project(data.geometry.coordinates)[0]+2)
        .attr("y", project(data.geometry.coordinates)[1]-map.getZoom()/2)
        .attr("filter", "url(#f2)")
        .style("font-family", "sans-serif")
        .style("font-size", "10pt")
        .style("fill", "#FFFFFF")
        .style("font-weight", "bold")
        .style("text-anchor", "middle")
        .text(stationLUT[data.properties.TERMINAL_N][0]);
}

function remove_map_label() {
  g.selectAll("text").remove();
}

//takes two an input x.y pixel coordinates and calculates the distance between x and y in lat/long
//returns [lat_delta, lng_delta]
function getLatLngDistance(x1, y1, x2, y2){
  var latlng1 = map.layerPointToLatLng(new L.Point(x1, y1));
  var latlng2 = map.layerPointToLatLng(new L.Point(x2, y2));
  return ([Math.abs(latlng1.lat - latlng2.lat), Math.abs(latlng1.lng - latlng2.lng)]);
}

function showPopup(from, to) {
  var API_KEY = "Fmjtd%7Cluubnuu7lu%2C8s%3Do5-9uya9u",
    URL = "http://open.mapquestapi.com/directions/v2/route?key=%s&outFormat=json&shapeFormat=raw&generalize=1&routeType=bicycle&from=%s,%s&to=%s,%s"
    newURL = sprintf(URL, API_KEY, from[2], from[1], to[2], to[1]) 
    d3.json(newURL, function(collection) {
      if (collection.info.statuscode != 0) {
        //code to handle bad results.. maybe try ped or car request
      } else {
        //code to show popup        
        var distance = collection.route.distance,
          time = collection.route.formattedTime,
          turns = sprintf("<h3>%s to %s</h3><strong>Distance</strong> %s miles &nbsp;&nbsp;&nbsp;<strong>Travel time</strong> %s<br><strong>Directions</strong><br>", from[0], to[0], distance.toString().slice(0,-1), time);
        collection.route.legs[0].maneuvers.forEach(function(maneuver){
          turns += sprintf("- %s<br>", maneuver.narrative);
        });
        var popupOffset = getLatLngDistance(0, 0, 360, 0)[1] / 2;
        var popup = L.popup({zoomAnimation : false})
          .setLatLng([to[2] > from[2] ? from[2] : to[2], (to[1] > from[1] ? to[1] : from[1]) + popupOffset])
          .setContent(turns)
          .openOn(map);
        map.on("zoomend" , function() {
          popupOffset = getLatLngDistance(0, 0, 360, 0)[1] / 2;
          map.closePopup(popup);
          popup.setLatLng([to[2] > from[2] ? from[2] : to[2], (to[1] > from[1] ? to[1] : from[1]) + popupOffset])
            .openOn(map);
        });
      }
    });
}
