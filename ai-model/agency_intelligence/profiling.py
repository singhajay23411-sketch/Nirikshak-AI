"""profiling.py

In-memory historical performance profiling engine for canonical implementing agencies (IA)
and district nodal authorities (IDA). Builds statistical records across project tenures.
"""

from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np
from .config import (
    STATUTORY_DELAY_THRESHOLD_DAYS,
    MATURE_BASELINE_DELAY_RATE,
    MATURE_BASELINE_MEDIAN_DAYS,
    EB_PRIOR_ALPHA,
    EB_PRIOR_BETA,
    DATA_CONFIDENCE_THRESHOLDS,
)
from .canonicalization import canonicalize_ia, canonicalize_ida


def build_agency_profiles(
    works_df: pd.DataFrame,
    exp_df: pd.DataFrame,
    observation_dt: Optional[pd.Timestamp] = None
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Build in-memory historical profiles for Canonical IA Parents and Canonical IDAs.

    If observation_dt is provided, point-in-time historical quarantine is enforced:
    only projects sanctioned prior to observation_dt are included.

    Returns:
        (ia_profiles_df, ida_profiles_df)
    """
    works = works_df.copy()
    exp = exp_df.copy()

    # Parse datetime columns
    works['sanction_dt'] = pd.to_datetime(works['sanction_date'], errors='coerce')
    works['actual_end_dt'] = pd.to_datetime(works['actual_end_date'], errors='coerce')

    # Point-in-Time Temporal Quarantine if observation_dt is provided
    if observation_dt is not None:
        works = works[works['sanction_dt'] <= observation_dt].copy()

    # Canonicalize IA in expenditures
    raw_ias = exp['ia_name'].dropna().unique()
    ia_map = {ia: canonicalize_ia(ia) for ia in raw_ias}

    exp['canonical_ia_parent'] = exp['ia_name'].map(lambda x: ia_map.get(x, ("UNKNOWN_AGENCY", "General", "Other", "", "LOW", ""))[0])
    exp['ia_branch'] = exp['ia_name'].map(lambda x: ia_map.get(x, ("UNKNOWN_AGENCY", "General", "Other", "", "LOW", ""))[1])
    exp['ia_agency_type'] = exp['ia_name'].map(lambda x: ia_map.get(x, ("UNKNOWN_AGENCY", "General", "Other", "", "LOW", ""))[2])
    exp['ia_confidence'] = exp['ia_name'].map(lambda x: ia_map.get(x, ("UNKNOWN_AGENCY", "General", "Other", "", "LOW", ""))[4])

    # Link expenditures to works
    work_ia = exp.groupby('work_id').agg({
        'canonical_ia_parent': 'first',
        'ia_branch': 'first',
        'ia_agency_type': 'first',
        'ia_confidence': 'first',
        'vendor_id': lambda v: list(v.dropna().unique()),
        'expenditure_id': 'count'
    }).reset_index().rename(columns={'expenditure_id': 'num_exp_records', 'vendor_id': 'distinct_vendors'})

    works = works.merge(work_ia, on='work_id', how='left')

    # Canonicalize IDA in works
    raw_idas = works['ida_name'].dropna().unique()
    ida_map = {ida: canonicalize_ida(ida) for ida in raw_idas}
    works['canonical_ida_name'] = works['ida_name'].map(lambda x: ida_map.get(x, ("UNKNOWN_IDA", "UNKNOWN"))[0])
    works['ida_district'] = works['ida_name'].map(lambda x: ida_map.get(x, ("UNKNOWN_IDA", "UNKNOWN"))[1])

    # Completed population
    valid_completed_mask = (
        works['sanction_dt'].notnull() &
        works['actual_end_dt'].notnull() &
        (works['actual_end_dt'] >= works['sanction_dt'])
    )
    # If observation_dt provided, ensure actual_end_dt is prior to observation_dt for completed status
    if observation_dt is not None:
        valid_completed_mask = valid_completed_mask & (works['actual_end_dt'] <= observation_dt)

    completed_works = works[valid_completed_mask].copy()
    completed_works['completion_duration_days'] = (completed_works['actual_end_dt'] - completed_works['sanction_dt']).dt.days
    completed_works['is_delayed'] = (completed_works['completion_duration_days'] > STATUTORY_DELAY_THRESHOLD_DAYS).astype(int)

    # Helper: Fast sweep-line workload
    def compute_workload(sub_sanctioned):
        if len(sub_sanctioned) == 0:
            return 0, 0.0, 0, 1.0
        events = []
        for _, r in sub_sanctioned.iterrows():
            s = r['sanction_dt']
            e = r['actual_end_dt']
            events.append((s, 1))
            if pd.notnull(e):
                events.append((e, -1))
        events.sort(key=lambda x: (x[0], -x[1]))
        running = 0
        samples = []
        for _, val in events:
            running += val
            samples.append(running)
        h_med = float(np.median(samples)) if len(samples) > 0 else 0.0
        h_max = int(np.max(samples)) if len(samples) > 0 else 0
        curr = int((sub_sanctioned['actual_end_dt'].isnull()).sum())
        press = (curr / h_med) if h_med > 0 else (1.0 if curr == 0 else 2.0)
        return curr, h_med, h_max, press

    # 1. Profile IA Parents
    ia_rows = []
    for p_name, grp in works.dropna(subset=['canonical_ia_parent']).groupby('canonical_ia_parent'):
        c_grp = completed_works[completed_works['canonical_ia_parent'] == p_name]
        tot = len(grp)
        comp = len(c_grp)
        act = (grp['work_status'] == 'Sanctioned').sum()

        if comp > 0:
            del_cnt = c_grp['is_delayed'].sum()
            naive_del = c_grp['is_delayed'].mean()
            med_dur = c_grp['completion_duration_days'].median()
            mean_dur = c_grp['completion_duration_days'].mean()
            std_dur = c_grp['completion_duration_days'].std() if comp > 1 else 0.0
        else:
            del_cnt = 0
            naive_del = np.nan
            med_dur = np.nan
            mean_dur = np.nan
            std_dur = np.nan

        # Empirical Bayes shrunken delay rate
        shrunk_del = (del_cnt + EB_PRIOR_ALPHA) / (comp + EB_PRIOR_ALPHA + EB_PRIOR_BETA)

        # Workload
        curr_w, h_med_w, h_max_w, w_press = compute_workload(grp[grp['sanction_dt'].notnull()])

        # Confidence tier
        if comp >= 100:
            c_tier = "Strong"
        elif comp >= 20:
            c_tier = "Moderate"
        elif comp >= 5:
            c_tier = "Low"
        else:
            c_tier = "Very Low"

        # Vendor info
        exp_sub = exp[exp['canonical_ia_parent'] == p_name]
        v_list = exp_sub['vendor_id'].dropna()
        num_v = v_list.nunique()
        if len(v_list) > 0 and num_v > 0:
            top_v_share = v_list.value_counts().iloc[0] / len(v_list)
            v_hhi = ((v_list.value_counts() / len(v_list)) ** 2).sum()
        else:
            top_v_share = np.nan
            v_hhi = np.nan

        ia_rows.append({
            'canonical_agency_name': p_name,
            'agency_type': grp['ia_agency_type'].iloc[0],
            'total_projects': tot,
            'completed_projects': comp,
            'active_projects': act,
            'delay_count': del_cnt,
            'naive_delay_rate': naive_del,
            'shrunken_delay_rate': shrunk_del,
            'median_duration_days': med_dur,
            'mean_duration_days': mean_dur,
            'std_duration_days': std_dur,
            'active_workload': curr_w,
            'historical_median_workload': h_med_w,
            'workload_pressure': w_press,
            'data_confidence': c_tier,
            'distinct_vendors': num_v,
            'top_vendor_share': top_v_share,
            'vendor_hhi': v_hhi,
        })

    ia_profile_df = pd.DataFrame(ia_rows)

    # 2. Profile IDAs
    ida_rows = []
    for ida_name, grp in works.dropna(subset=['canonical_ida_name']).groupby('canonical_ida_name'):
        c_grp = completed_works[completed_works['canonical_ida_name'] == ida_name]
        tot = len(grp)
        comp = len(c_grp)
        act = (grp['work_status'] == 'Sanctioned').sum()

        if comp > 0:
            del_cnt = c_grp['is_delayed'].sum()
            naive_del = c_grp['is_delayed'].mean()
            med_dur = c_grp['completion_duration_days'].median()
            mean_dur = c_grp['completion_duration_days'].mean()
            std_dur = c_grp['completion_duration_days'].std() if comp > 1 else 0.0
        else:
            del_cnt = 0
            naive_del = np.nan
            med_dur = np.nan
            mean_dur = np.nan
            std_dur = np.nan

        shrunk_del = (del_cnt + EB_PRIOR_ALPHA) / (comp + EB_PRIOR_ALPHA + EB_PRIOR_BETA)
        curr_w, h_med_w, h_max_w, w_press = compute_workload(grp[grp['sanction_dt'].notnull()])

        if comp >= 100:
            c_tier = "Strong"
        elif comp >= 20:
            c_tier = "Moderate"
        elif comp >= 5:
            c_tier = "Low"
        else:
            c_tier = "Very Low"

        ida_rows.append({
            'canonical_ida_name': ida_name,
            'district': grp['ida_district'].iloc[0],
            'total_projects': tot,
            'completed_projects': comp,
            'active_projects': act,
            'delay_count': del_cnt,
            'naive_delay_rate': naive_del,
            'shrunken_delay_rate': shrunk_del,
            'median_duration_days': med_dur,
            'mean_duration_days': mean_dur,
            'std_duration_days': std_dur,
            'active_workload': curr_w,
            'historical_median_workload': h_med_w,
            'workload_pressure': w_press,
            'data_confidence': c_tier,
        })

    ida_profile_df = pd.DataFrame(ida_rows)

    return ia_profile_df, ida_profile_df
