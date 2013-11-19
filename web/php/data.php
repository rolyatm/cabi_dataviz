<?php
    $username = "root"; 
    $password = "Stella1!";   
    $host = "localhost";
    $database="cabi_dataviz";
    
    $db = new mysqli($host, $username, $password, $database);
    if ($db->connect_errno) {
      echo "Failed to connect to MySQL: (" . $db->connect_errno . ") " . $db->connect_error;
    }

    $statement = $db->prepare("SELECT `json` FROM `routes` WHERE `s_from` = ?");
    $station = $_GET['station'];
    $statement->bind_param('s', $station);
    
    $statement->execute();
    $statement->bind_result($routes);
    
    $data = array();
    while($statement->fetch()){
      //printf ($routes);
      $data[] = $routes;
    }
    
    $statement->free_result();
    $statement->close();
    $db->close();
    $features = implode(',', $data);
    $geojson = '{ "type": "FeatureCollection","features": [%s]}';
    echo sprintf($geojson, $features);
?>