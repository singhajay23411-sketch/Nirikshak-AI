import psycopg2
from backend.database import get_connection

def migrate():
    conn = get_connection()
    cur = conn.cursor()
    
    print("Starting hash columns migration...")

    tables = ["works", "expenditures", "mp_allocations"]
    
    for table in tables:
        print(f"Altering {table}...")
        cur.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS record_hash TEXT;")
        cur.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;")
    
    conn.commit()
    cur.close()
    conn.close()
    print("Migration successfully completed!")

if __name__ == "__main__":
    migrate()
