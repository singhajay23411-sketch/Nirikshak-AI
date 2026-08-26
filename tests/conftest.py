"""conftest.py

Defines mock data fixtures for testing the FinGuard analytics module.
Contains small, controlled datasets for works and expenditures to test
all rules, normalizations, cost benchmarks, fallbacks, and scores.
"""

import pytest
import pandas as pd

@pytest.fixture
def mock_works_df():
    """Provides a small synthetic dataset of works."""
    data = [
        # Normal project, Completed, no anomalies
        {
            "work_id": 101,
            "activity_name": "WS/MP123/2023-2024/1001-Construction of roads",
            "work_description": "Road construction in village A",
            "work_category": "Normal/Others",
            "mp_id": 1,
            "house_type": 2,
            "tenure": "18th Lok Sabha",
            "state_id": 10,
            "sanction_amount": 100000.0,
            "actual_amount": 100000.0,
            "work_status": "Completed",
            "flag": 3
        },
        # Project with disbursement overrun and mismatch (completed)
        {
            "work_id": 102,
            "activity_name": "WS/MP123/2023-2024/1002-Construction of community centers",
            "work_description": "Community center construction",
            "work_category": "Normal/Others",
            "mp_id": 1,
            "house_type": 2,
            "tenure": "18th Lok Sabha",
            "state_id": 10,
            "sanction_amount": 100000.0,
            "actual_amount": 90000.0,
            "work_status": "Completed",
            "flag": 3
        },
        # Project with high sanction amount (expensive benchmark test)
        {
            "work_id": 103,
            "activity_name": "WS/MP123/2023-2024/1003-Street lights",
            "work_description": "Solar lights installation",
            "work_category": "Normal/Others",
            "mp_id": 1,
            "house_type": 2,
            "tenure": "18th Lok Sabha",
            "state_id": 10,
            "sanction_amount": 500000.0,  # Highly expensive relative to peer group (which is 50,000)
            "actual_amount": 500000.0,
            "work_status": "Completed",
            "flag": 3
        },
        # Recommended project, flag=1
        {
            "work_id": 104,
            "activity_name": "NA-Street lights",
            "work_description": "LED lights installation",
            "work_category": "Normal/Others",
            "mp_id": 2,
            "house_type": 2,
            "tenure": "17",  # Inconsistent tenure representation
            "state_id": 10,
            "sanction_amount": 50000.0,
            "actual_amount": None,
            "work_status": "Recommended",
            "flag": 1
        },
        # Recommended project, flag=2 (uncommonRecommended case)
        {
            "work_id": 105,
            "activity_name": "WS/RS456/2024-2025/2001-Installing tube-wells and borewells",
            "work_description": "Water tubewells",
            "work_category": "Normal/Others",
            "mp_id": 3,
            "house_type": 1,
            "tenure": "Rajya Sabha",
            "state_id": 12,
            "sanction_amount": None,
            "actual_amount": None,
            "work_status": "Recommended",
            "flag": 2
        }
    ]
    
    # Generate additional records of 'Street lights' to form a stable peer group of size >= 15
    for i in range(15):
        data.append({
            "work_id": 200 + i,
            "activity_name": f"WS/MP999/2023-2024/{3000 + i}-Street lights",
            "work_description": f"Street light {i}",
            "work_category": "Normal/Others",
            "mp_id": 99,
            "house_type": 2,
            "tenure": "18th Lok Sabha",
            "state_id": 10,
            "sanction_amount": 50000.0,
            "actual_amount": 50000.0,
            "work_status": "Completed",
            "flag": 3
        })
        
    return pd.DataFrame(data)

@pytest.fixture
def mock_expenditures_df():
    """Provides a small synthetic dataset of expenditures."""
    data = [
        # Work 101: 1 perfect payment of 100k
        {
            "expenditure_id": 1,
            "work_id": 101,
            "vendor_id": 11,
            "fund_disbursed_amount": 100000.0,
            "expenditure_date": "2024-04-01",
            "ia_name": "Rural Development Agency",
            "mp_id": 1,
            "house_type": 2,
            "tenure": "18th Lok Sabha",
            "work_status": "Payment Success"
        },
        # Work 102: Overrun disbursement (110k vs 100k sanction) + Mismatch (110k vs 90k actual)
        # Split into two payments to the same vendor, one duplicated!
        {
            "expenditure_id": 2,
            "work_id": 102,
            "vendor_id": 12,
            "fund_disbursed_amount": 55000.0,
            "expenditure_date": "2024-04-05",
            "ia_name": "Nodal Agency",
            "mp_id": 1,
            "house_type": 2,
            "tenure": "18th Lok Sabha",
            "work_status": "Payment Success"
        },
        {
            "expenditure_id": 3,
            "work_id": 102,
            "vendor_id": 12,
            "fund_disbursed_amount": 55000.0,
            "expenditure_date": "2024-04-05",
            "ia_name": "Nodal Agency",
            "mp_id": 1,
            "house_type": 2,
            "tenure": "18th Lok Sabha",
            "work_status": "Payment Success"
        },
        # Work 103: Payments to multiple vendors, concentration test
        # Vendor 13 gets 450k out of 500k total. Heavy concentration.
        {
            "expenditure_id": 4,
            "work_id": 103,
            "vendor_id": 13,
            "fund_disbursed_amount": 450000.0,
            "expenditure_date": "2024-04-10",
            "ia_name": "District Agency",
            "mp_id": 1,
            "house_type": 2,
            "tenure": "18th Lok Sabha",
            "work_status": "Payment Success"
        },
        {
            "expenditure_id": 5,
            "work_id": 103,
            "vendor_id": 14,
            "fund_disbursed_amount": 50000.0,
            "expenditure_date": "2024-04-12",
            "ia_name": "District Agency",
            "mp_id": 1,
            "house_type": 2,
            "tenure": "18th Lok Sabha",
            "work_status": "Payment Success"
        }
    ]
    return pd.DataFrame(data)
