import sqlite3
import os

db_path = os.path.abspath("backend/nirikshak_users.db")
print("Connecting to:", db_path)
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

try:
    cursor.execute("SELECT id, email, username, role, is_active FROM users;")
    rows = cursor.fetchall()
    print("USERS IN DATABASE:")
    for r in rows:
        print(dict(r))
except Exception as e:
    print("Error querying users table:", e)

cursor.close()
conn.close()
