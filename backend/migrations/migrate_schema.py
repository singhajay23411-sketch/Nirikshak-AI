import psycopg2
from backend.database import get_connection

def migrate():
    conn = get_connection()
    cur = conn.cursor()
    
    print("Migrating schema...")
    
    # Drop existing primary key on mps table
    cur.execute("ALTER TABLE mps DROP CONSTRAINT IF EXISTS mps_pkey CASCADE;")
    
    # Add new columns if they don't exist
    cur.execute("ALTER TABLE mps ADD COLUMN IF NOT EXISTS allocated_limit REAL;")
    cur.execute("ALTER TABLE mps ADD COLUMN IF NOT EXISTS calamity_amount REAL;")
    
    # Add composite primary key
    cur.execute("ALTER TABLE mps ADD PRIMARY KEY (mp_id, house_type, tenure);")
    
    # The foreign key in mp_allocations, works, and expenditures points to mps(mp_id).
    # Since we dropped the PK constraint, the FK constraint was dropped too (because of CASCADE).
    # We must restore the FK constraints to just reference the mp_id if possible. 
    # But PostgreSQL requires FK to reference a unique key. 
    # Since mp_id alone is unique across terms for a person in this API, let's create a UNIQUE constraint on mp_id.
    cur.execute("ALTER TABLE mps ADD CONSTRAINT mps_mp_id_key UNIQUE (mp_id);")
    
    # Re-add foreign keys that were dropped
    cur.execute("ALTER TABLE mp_allocations DROP CONSTRAINT IF EXISTS mp_allocations_mp_id_fkey;")
    cur.execute("ALTER TABLE mp_allocations ADD CONSTRAINT mp_allocations_mp_id_fkey FOREIGN KEY (mp_id) REFERENCES mps(mp_id);")
    
    cur.execute("ALTER TABLE works DROP CONSTRAINT IF EXISTS works_mp_id_fkey;")
    cur.execute("ALTER TABLE works ADD CONSTRAINT works_mp_id_fkey FOREIGN KEY (mp_id) REFERENCES mps(mp_id);")
    
    cur.execute("ALTER TABLE expenditures DROP CONSTRAINT IF EXISTS expenditures_mp_id_fkey;")
    cur.execute("ALTER TABLE expenditures ADD CONSTRAINT expenditures_mp_id_fkey FOREIGN KEY (mp_id) REFERENCES mps(mp_id);")
    
    conn.commit()
    cur.close()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
