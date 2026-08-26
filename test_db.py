import psycopg2
import psycopg2.extras
from backend.database import get_connection

conn = get_connection()
cur = conn.cursor()

updated_works = [
    ('Activity', 'Desc', 'Cat', 3018340, 2, '18th Lok Sabha', 1, 1, 'IDA', 'LNO',
     None, None, None, None, None, None,
     'Stage', 'Status', None, None, 'hash123', 9999999)
]

try:
    psycopg2.extras.execute_values(cur, """
        UPDATE works SET 
            activity_name=e.activity_name, work_description=e.work_description, work_category=e.work_category,
            mp_id=e.mp_id, house_type=e.house_type, tenure=e.tenure, constituency_id=e.constituency_id, state_id=e.state_id,
            ida_name=e.ida_name, letter_no=e.letter_no, recommended_amount=e.recommended_amount, sanction_amount=e.sanction_amount,
            actual_amount=e.actual_amount, recommendation_date=CAST(e.recommendation_date AS DATE), sanction_date=CAST(e.sanction_date AS DATE), 
            actual_end_date=CAST(e.actual_end_date AS DATE), work_stage=e.work_stage, work_status=e.work_status, average_rating=e.average_rating, 
            flag=e.flag, record_hash=e.record_hash, updated_at=CURRENT_TIMESTAMP
        FROM (VALUES %s) AS e(
            activity_name, work_description, work_category, mp_id, house_type, tenure, constituency_id, state_id,
            ida_name, letter_no, recommended_amount, sanction_amount, actual_amount, recommendation_date, sanction_date,
            actual_end_date, work_stage, work_status, average_rating, flag, record_hash, work_id
        ) WHERE works.work_id = e.work_id
    """, updated_works, template="(%s, %s, %s, %s::int, %s::int, %s, %s::int, %s::int, %s, %s, %s::numeric, %s::numeric, %s::numeric, %s::date, %s::date, %s::date, %s, %s, %s::real, %s::int, %s, %s::int)")
    print('UPDATE WORKS SUCCESS')
except Exception as e:
    print('UPDATE WORKS FAILED:', e)

conn.rollback()
