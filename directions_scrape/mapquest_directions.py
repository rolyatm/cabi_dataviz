import os, json
from urllib import urlopen, quote

API_KEY = 'Fmjtd%7Cluubnuu7lu%2C8s%3Do5-9uya9u'
URL = 'http://open.mapquestapi.com/directions/v1/route?key=%s&outFormat=json&routeType=bicycle&generalize=5&from=%s&to=%s'
geojson = '{"type": "FeatureCollection","features": [%s]}'
features = []
newFeature = '{ "type": "Feature", "id": %s, "properties": { "from": %s, "to": %s }, "geometry": { "type": "LineString", "coordinates": %s } }'
id = 0
with open('cabi_stations_2012_test.csv', 'r') as fr:
	lines = fr.readlines()
	lines = [l.strip() for l in lines]
	stations =  [l.split(',') for l in lines]

	for source in stations:
		for destination in stations:
			s = ','.join(source[1:])
			d = ','.join(destination[1:])
			if (s == d) or (source[0] == 'TERMINAL_N') or (destination[0] == 'TERMINAL_N'):
				continue
			else:
				data = urlopen(URL %(API_KEY, s, d)).read()
				directions = json.loads(data)
				shape = directions['route']['shape']['shapePoints']
				formattedShape = [[shape[i], shape[i-1]] for i, x in enumerate(shape) if (i%2 != 0)]
				features.append(newFeature %(id, source[0], destination[0], formattedShape))
				id+=1
with open('cabi_routes.geojson', 'w') as fw:
	fw.write(geojson %(','.join(features)))

