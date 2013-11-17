import mysql.connector
	
cnx = mysql.connector.connect(host='localhost', user='root', password='Stella1!', database='cabi_dataviz')
cursor=cnx.cursor()
query = ("DESCRIBE routes;")
cursor.execute(query)
#cnx.commit()
for c in cursor:
	print c
cursor.close()
cnx.close()
