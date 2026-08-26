"""export_dataset_bundle.py

Exports the entire PostgreSQL dataset into a highly optimized format for ML workloads.
- Dumps each table as a Parquet file for instant pandas/polars loading.
- Creates a PostgreSQL custom dump (.dump) for exact database replication.
- Bundles everything with a README into a single ZIP archive.
"""

import os
import shutil
import zipfile
import subprocess
import pandas as pd
from typing import List

from backend.database import get_connection, get_connection_params

EXPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "export")
ZIP_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "nirikshak_ml_dataset.zip")

TABLES = [
    "states",
    "constituencies",
    "mps",
    "mp_allocations",
    "works",
    "vendors",
    "expenditures"
]

def export_to_parquet():
    """Reads tables from PostgreSQL and writes them to .parquet files."""
    print(f"Exporting tables to Parquet format...")
    conn = get_connection()
    
    for table in TABLES:
        print(f"  -> Exporting {table}.parquet")
        query = f"SELECT * FROM {table};"
        df = pd.read_sql_query(query, conn)
        parquet_path = os.path.join(EXPORT_DIR, f"{table}.parquet")
        df.to_parquet(parquet_path, engine="pyarrow", compression="snappy")
        
    conn.close()

def export_pg_dump():
    """Creates a custom format database dump using pg_dump."""
    print("Exporting PostgreSQL custom dump...")
    params = get_connection_params()
    dump_path = os.path.join(EXPORT_DIR, "nirikshak_backup.dump")
    
    env = os.environ.copy()
    env["PGPASSWORD"] = params["password"]
    
    cmd = [
        "pg_dump",
        "-h", params["host"],
        "-p", str(params["port"]),
        "-U", params["user"],
        "-Fc",  # custom format
        "-f", dump_path,
        params["dbname"]
    ]
    
    try:
        subprocess.run(cmd, env=env, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(f"  -> Created {dump_path}")
    except subprocess.CalledProcessError as e:
        print(f"  -> pg_dump failed! Make sure PostgreSQL bin directory is in your PATH.")
        print(f"     Error: {e.stderr.decode()}")
        print(f"     Skipping pg_dump export.")
    except FileNotFoundError:
        print("  -> 'pg_dump' command not found in PATH. Skipping pg_dump export.")

def create_readme():
    """Generates a README.md explaining how to use the dataset."""
    readme_path = os.path.join(EXPORT_DIR, "README.md")
    content = """# Nirikshak AI - ML Dataset Bundle

This bundle contains the complete extracted MPLADS dataset, optimized for both Data Science workloads and robust Backend restoration.

## 1. Quick Analysis (Pandas / Polars)
For immediate exploratory data analysis (EDA) or training machine learning models, use the included `.parquet` files. Parquet files are highly compressed and maintain strict column data types, making them significantly faster than CSVs.

```python
import pandas as pd

# Load the works and expenditures tables
works_df = pd.read_parquet('works.parquet')
expenditures_df = pd.read_parquet('expenditures.parquet')

print(f"Total Works: {len(works_df)}")
```

## 2. Full Database Restoration (PostgreSQL)
If you want to run complex relational SQL queries or restore the backend API, you can clone the exact PostgreSQL database state using the included `.dump` file.

Open your terminal and run:
```bash
# This will restore the schema, data, and constraints into a local database
pg_restore -U postgres -d nirikshak -1 nirikshak_backup.dump
```
*(Make sure you have created the empty `nirikshak` database first: `createdb -U postgres nirikshak`)*
"""
    with open(readme_path, "w") as f:
        f.write(content)
    print("  -> Created README.md")

def create_zip_archive():
    """Zips the export directory and prints the final size."""
    print("Bundling files into ZIP archive...")
    
    with zipfile.ZipFile(ZIP_FILE_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(EXPORT_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                # Ensure the files are at the root of the ZIP
                arcname = os.path.relpath(file_path, EXPORT_DIR)
                zipf.write(file_path, arcname)
                
    size_mb = os.path.getsize(ZIP_FILE_PATH) / (1024 * 1024)
    print(f"  -> Successfully created {os.path.basename(ZIP_FILE_PATH)} ({size_mb:.2f} MB)")

def main():
    print("=" * 60)
    print("NIRIKSHAK AI - ML DATASET EXPORTER")
    print("=" * 60)
    
    os.makedirs(EXPORT_DIR, exist_ok=True)
    
    export_to_parquet()
    export_pg_dump()
    create_readme()
    create_zip_archive()
    
    print("\n" + "=" * 60)
    print("EXPORT COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    main()
