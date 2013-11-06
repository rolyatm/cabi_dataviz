#Step 1 - iterate through file and pull out station pairs, increment counter for each pair
with open ('sample_trip_data.csv') as f:
	for line in f:
		trip = [l.split(',') for l in line]
		print trip
