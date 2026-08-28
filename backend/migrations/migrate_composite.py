import psycopg2
from backend.database import get_connection

def migrate():
    conn = get_connection()
    cur = conn.cursor()
    
    print("Starting composite key migration...")

    # 1. Drop existing FK constraints (if any remain) and UNIQUE constraints on mps
    cur.execute("ALTER TABLE mp_allocations DROP CONSTRAINT IF EXISTS mp_allocations_mp_id_fkey;")
    cur.execute("ALTER TABLE works DROP CONSTRAINT IF EXISTS works_mp_id_fkey;")
    cur.execute("ALTER TABLE expenditures DROP CONSTRAINT IF EXISTS expenditures_mp_id_fkey;")
    cur.execute("ALTER TABLE mps DROP CONSTRAINT IF EXISTS mps_mp_id_key;")
    
    # 2. Add columns to mp_allocations (Wait, mp_allocations already has house_name and tenure!)
    # But it doesn't have house_type (integer). Let's just add house_type.
    cur.execute("ALTER TABLE mp_allocations ADD COLUMN IF NOT EXISTS house_type INTEGER;")
    
    # 3. Add columns to works
    cur.execute("ALTER TABLE works ADD COLUMN IF NOT EXISTS house_type INTEGER;")
    cur.execute("ALTER TABLE works ADD COLUMN IF NOT EXISTS tenure TEXT;")
    
    # 4. Add columns to expenditures
    cur.execute("ALTER TABLE expenditures ADD COLUMN IF NOT EXISTS house_type INTEGER;")
    cur.execute("ALTER TABLE expenditures ADD COLUMN IF NOT EXISTS tenure TEXT;")

    # 5. Backfill the existing records
    # Since we haven't successfully inserted duplicate mp_ids yet, we can safely join on mp_id.
    print("Backfilling existing records...")
    cur.execute("""
        UPDATE works w 
        SET house_type = m.house_type, tenure = m.tenure 
        FROM mps m 
        WHERE w.mp_id = m.mp_id;
    """)
    
    cur.execute("""
        UPDATE expenditures e 
        SET house_type = m.house_type, tenure = m.tenure 
        FROM mps m 
        WHERE e.mp_id = m.mp_id;
    """)
    
    cur.execute("""
        UPDATE mp_allocations a 
        SET house_type = m.house_type, tenure = m.tenure 
        FROM mps m 
        WHERE a.mp_id = m.mp_id;
    """)

    # 6. Re-add Composite Foreign Key constraints
    print("Adding composite foreign keys...")
    cur.execute("""
        ALTER TABLE mp_allocations 
        ADD CONSTRAINT mp_allocations_composite_fkey 
        FOREIGN KEY (mp_id, house_type, tenure) REFERENCES mps(mp_id, house_type, tenure);
    """)
    
    cur.execute("""
        ALTER TABLE works 
        ADD CONSTRAINT works_composite_fkey 
        FOREIGN KEY (mp_id, house_type, tenure) REFERENCES mps(mp_id, house_type, tenure);
    """)
    
    cur.execute("""
        ALTER TABLE expenditures 
        ADD CONSTRAINT expenditures_composite_fkey 
        FOREIGN KEY (mp_id, house_type, tenure) REFERENCES mps(mp_id, house_type, tenure);
    """)
    
    conn.commit()
    cur.close()
    conn.close()
    print("Migration successfully completed!")

if __name__ == "__main__":
    migrate()
