import sqlite3
import os

db_path = os.path.abspath("backend/nirikshak_users.db")
print("Connecting to:", db_path)
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

try:
    cursor.execute("SELECT * FROM inspections WHERE project_id = '60423' OR project_id = 60423;")
    rows = cursor.fetchall()
    print("INSPECTIONS:")
    for r in rows:
        print(dict(r))
except Exception as e:
    print("Error:", e)

cursor.close()
conn.close()
