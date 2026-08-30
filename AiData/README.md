# Nirikshak AI - ML Dataset Bundle

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
