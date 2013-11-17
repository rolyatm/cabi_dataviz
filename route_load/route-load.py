import mysql.connector

cnx = mysql.connector.connect(host='localhost', user='root', password='Stella1!', database='cabi_dataviz)
cursor=cnx.cursor()
addRoute = ("INSERT into routes (s_from, s_to, json) VALUES (%s, %s, %s)")
route_data = f, t, j

cursor.execute(addRoute, routeData)
cnx.commit()
cursor.close()
cnx.close()
