#expects station1, lat1, long1, station2, lat2, long2
#add url success check before processing...
#write each line sequentially instead of waiting until end
import os, json, urllib2
from time import sleep

API_KEY = 'Fmjtd%7Cluubnuu7lu%2C8s%3Do5-9uya9u'
URL = 'http://open.mapquestapi.com/directions/v2/route?key=%s&narrativeType=html&outFormat=json&shapeFormat=raw&generalize=1&routeType=%s&from=%s&to=%s'
geojson = '{"type": "FeatureCollection","features": [%s]}'
features = []
newFeature = '{ "type": "Feature", "id": %s, "properties": { "from": %s, "to": %s, "count": %s}, "geometry": { "type": "LineString", "coordinates": %s } }'
count = 0
narrative = []

def requestDirections(url):
	try:
		req = urllib2.Request(url)
		response = urllib2.urlopen(req)
	except HTTPError, e:
		fw.write(geojson %(','.join(features)))
		print e.code
	except URLError, e:
		fw.write(geojson %(','.join(features)))
		print e.reason
	else:
		try:
			data = response.read()
			directions = json.loads(data)
			return directions
		except:
			fw.write(geojson %(','.join(features)))
			print data

with open('cabi_trips_2012_test.csv', 'r') as fr, open('cabi_routes.geojson', 'w') as fw:
	lines = fr.readlines()
	lines = [l.strip() for l in lines]
	routes =  [l.split(',') for l in lines]

	for r in routes:
		s = ','.join(r[1:3])
		d = ','.join(r[4:6])
		if (s == d) or (r[0] == 'sTERMINAL_N'):
			continue
		else:
			print '%s - %s' %(count, r)
			#submit directions request
			directions = requestDirections(URL %(API_KEY, 'bicycle', s, d))
			#checks to see if route was found and if not, requests ped route and then shortest route and finally skips
			if directions['info']['statuscode'] != 0:
				directions = requestDirections(URL %(API_KEY, 'pedestrian', s, d))
				if directions['info']['statuscode'] != 0:
					directions = requestDirections(URL %(API_KEY, 'shortest', s, d))
					if directions['info']['statuscode'] != 0:
						continue
			#pulls out shape points and formats into geojson
			shape = directions['route']['shape']['shapePoints']
			formattedShape = [[shape[i], shape[i-1]] for i, x in enumerate(shape) if (i%2 != 0)]
			features.append(newFeature %(count, r[0], r[3], r[6], formattedShape))
			#pull out turn by turn directions
			distance = directions['route']['legs'][0]['distance']
			print distance
			time = directions['route']['legs'][0]['formattedTime']
			print time
			maneuvers = directions['route']['legs'][0]['maneuvers']
			for m in maneuvers:
                          narrative.append(m['narrative'])
			count+=1
		#sleep(.25)
	print "Requests complete, writing output"
	#fw.write(geojson %(','.join(features)))
	fw.write(distance)
	fw.write(time)
	fw.write('<br>'.join(narrative))