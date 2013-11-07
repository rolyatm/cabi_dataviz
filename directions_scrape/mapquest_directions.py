#expects station1, lat1, long1, station2, lat2, long2
#add url success check before processing...
#write each line sequentially instead of waiting until end
import os, json
from urllib import urlopen, quote
from time import sleep

API_KEY = 'Fmjtd%7Cluubnuu7lu%2C8s%3Do5-9uya9u'
URL = 'http://open.mapquestapi.com/directions/v1/route?key=%s&outFormat=json&routeType=bicycle&generalize=5&from=%s&to=%s'
geojson = '{"type": "FeatureCollection","features": [%s]}'
features = []
newFeature = '{ "type": "Feature", "id": %s, "properties": { "from": %s, "to": %s, "count": %s}, "geometry": { "type": "LineString", "coordinates": %s } }'
id = 0
with open('cabi_trips_2012.csv', 'r') as fr:
	lines = fr.readlines()
	lines = [l.strip() for l in lines]
	routes =  [l.split(',') for l in lines]

	for r in routes:
		s = ','.join(r[1:3])
		d = ','.join(r[4:6])
		if (s == d) or (r[0] == 'sTERMINAL_N'):
			continue
		else:
			print id
			data = urlopen(URL %(API_KEY, s, d)).read()
			directions = json.loads(data)
			shape = directions['route']['shape']['shapePoints']
			formattedShape = [[shape[i], shape[i-1]] for i, x in enumerate(shape) if (i%2 != 0)]
			features.append(newFeature %(id, r[0], r[3], r[6], formattedShape))
			
			id+=1
			
		sleep(1)

with open('cabi_routes.geojson', 'w') as fw:
	fw.write(geojson %(','.join(features)))

