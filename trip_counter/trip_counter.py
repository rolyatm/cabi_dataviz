#Step 1 - iterate through file and pull out station pairs, increment counter for each pair
#Read in station coords and store
#Create a dictionary that with the station pair as key and the count as the value
#As a new station pair is found, write the combo to a new file structured in the format needed for the direction download
trips = {}
stations = {}
with open ('2012-combined.csv', 'r') as rawTrips, open('cabi_stations.csv', 'r') as stationCoords, open('cabi_trips_2012.csv', 'w') as tripOut:
	for station in stationCoords:
		s = station.strip().split(',')
		stations[s[0]] = s[1],s[2]
	for line in rawTrips:
		if line.find('Start')!=-1:
			continue
		l = line.split(',')
		station_pair = l[4], l[7]
		#check to see if we have coords for station
		if station_pair[0] not in stations or station_pair[1] not in stations:
			continue
			
		#basic counter of trip amounts
		if station_pair in trips:
			trips[station_pair][6] += 1
		else:
			trips[station_pair] = [station_pair[0], stations[station_pair[0]][0], stations[station_pair[0]][1], station_pair[1], stations[station_pair[1]][0], stations[station_pair[1]][1], 1]

		#format station1, lat1, long1, station2, lat2, long2, count
	for t in trips:
		trips[t][6] = str(trips[t][6])
		tripOut.write ('%s' %(','.join(trips[t])))
		tripOut.write ('\n')
