import csv
import os
import re
import json

# File paths
csv_path = r"d:\code\Nirakshak AI\Nirikshak-AI\frontend\src\assets\india_constituencies_list.csv"
states_js_path = r"d:\code\Nirakshak AI\Nirikshak-AI\frontend\src\data\statePerformanceData.js"
mps_js_path = r"d:\code\Nirakshak AI\Nirikshak-AI\frontend\src\data\mpPerformanceData.js"
consts_js_path = r"d:\code\Nirakshak AI\Nirikshak-AI\frontend\src\data\indiaConstituencies.js"

# Helper to create slugs
def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

# Parse CSV
constituencies_by_state = {}
if os.path.exists(csv_path):
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if not row or len(row) < 3:
                continue
            state_ut = row[0].strip()
            sno = row[1].strip()
            const_name = row[2].strip()
            if state_ut not in constituencies_by_state:
                constituencies_by_state[state_ut] = []
            constituencies_by_state[state_ut].append({
                "sno": int(sno) if sno.isdigit() else len(constituencies_by_state[state_ut]) + 1,
                "name": const_name
            })

# Standard list of states and UTs with Hindi names and type
state_meta = {
    "Andhra Pradesh": {"nameHi": "आंध्र प्रदेश", "type": "State"},
    "Arunachal Pradesh": {"nameHi": "अरुणाचल प्रदेश", "type": "State"},
    "Assam": {"nameHi": "असम", "type": "State"},
    "Bihar": {"nameHi": "बिहार", "type": "State"},
    "Chhattisgarh": {"nameHi": "छत्तीसगढ़", "type": "State"},
    "Goa": {"nameHi": "गोवा", "type": "State"},
    "Gujarat": {"nameHi": "गुजरात", "type": "State"},
    "Haryana": {"nameHi": "हरियाणा", "type": "State"},
    "Himachal Pradesh": {"nameHi": "हिमाचल प्रदेश", "type": "State"},
    "Jharkhand": {"nameHi": "झारखंड", "type": "State"},
    "Karnataka": {"nameHi": "कर्नाटक", "type": "State"},
    "Kerala": {"nameHi": "केरल", "type": "State"},
    "Madhya Pradesh": {"nameHi": "मध्य प्रदेश", "type": "State"},
    "Maharashtra": {"nameHi": "महाराष्ट्र", "type": "State"},
    "Manipur": {"nameHi": "मणिपुर", "type": "State"},
    "Meghalaya": {"nameHi": "मेघालय", "type": "State"},
    "Mizoram": {"nameHi": "मिजोरम", "type": "State"},
    "Nagaland": {"nameHi": "नागालैंड", "type": "State"},
    "Odisha": {"nameHi": "ओडिशा", "type": "State"},
    "Punjab": {"nameHi": "पंजाब", "type": "State"},
    "Rajasthan": {"nameHi": "राजस्थान", "type": "State"},
    "Sikkim": {"nameHi": "सिक्किम", "type": "State"},
    "Tamil Nadu": {"nameHi": "तमिलनाडु", "type": "State"},
    "Telangana": {"nameHi": "तेलंगाना", "type": "State"},
    "Tripura": {"nameHi": "त्रिपुरा", "type": "State"},
    "Uttar Pradesh": {"nameHi": "उत्तर प्रदेश", "type": "State"},
    "Uttarakhand": {"nameHi": "उत्तराखंड", "type": "State"},
    "West Bengal": {"nameHi": "पश्चिम बंगाल", "type": "State"},
    "Andaman & Nicobar Islands": {"nameHi": "अंडमान और निकोबार द्वीप समूह", "type": "Union Territory"},
    "Chandigarh": {"nameHi": "चंडीगढ़", "type": "Union Territory"},
    "Dadra & Nagar Haveli & Daman & Diu": {"nameHi": "दादरा और नगर हवेली और दमन और दीव", "type": "Union Territory"},
    "Delhi": {"nameHi": "दिल्ली", "type": "Union Territory"},
    "Jammu & Kashmir": {"nameHi": "जम्मू और कश्मीर", "type": "Union Territory"},
    "Ladakh": {"nameHi": "लद्दाख", "type": "Union Territory"},
    "Lakshadweep": {"nameHi": "लक्षद्वीप", "type": "Union Territory"},
    "Puducherry": {"nameHi": "पुडुचेरी", "type": "Union Territory"}
}

# If any state from constituencies_by_state is not in state_meta, add it dynamically
for state_name in constituencies_by_state:
    if state_name not in state_meta:
        state_meta[state_name] = {"nameHi": state_name, "type": "State"}

# ─── Generate statePerformanceData.js ───
states_list = []
rank = 1
for state_name in sorted(state_meta.keys()):
    meta = state_meta[state_name]
    consts = constituencies_by_state.get(state_name, [{"sno": 1, "name": f"{state_name} Constituency"}])
    mp_count = len(consts)
    
    # Deterministic pseudo-random generation of performance data based on state name length
    util = 60 + (len(state_name) * 3) % 36
    if util > 95: util = 95.2
    
    allocated = mp_count * 5.0  # 5 CR per MP
    utilized = round((allocated * util) / 100, 2)
    works_rec = mp_count * 25
    works_done = int(works_rec * (util - 5) / 100)
    completion_pct = round((works_done / works_rec) * 100, 1)
    
    if util >= 80:
        perf = "High"
    elif util >= 70:
        perf = "Average"
    else:
        perf = "Needs Improvement"
        
    states_list.append({
        "slug": slugify(state_name),
        "state": state_name,
        "stateHi": meta["nameHi"],
        "type": meta["type"],
        "rank": rank,
        "performanceCategory": perf,
        "mpCount": mp_count,
        "totalAllocatedCr": allocated,
        "totalUtilizedCr": utilized,
        "utilizationPct": round(util, 1),
        "worksRecommended": works_rec,
        "worksCompleted": works_done,
        "completionPct": completion_pct,
        "constituencies": [{"id": slugify(c["name"]), "sno": c["sno"], "name": c["name"], "nameHi": c["name"]} for c in consts]
    })
    rank += 1

# Sort states_list by rank (utilization percentage desc)
states_list.sort(key=lambda x: x["utilizationPct"], reverse=True)
for i, s in enumerate(states_list):
    s["rank"] = i + 1

# Write statePerformanceData.js
national_summary = {
    "totalStates": len(states_list),
    "totalAllocatedCr": round(sum(s["totalAllocatedCr"] for s in states_list), 1),
    "totalUtilizedCr": round(sum(s["totalUtilizedCr"] for s in states_list), 1),
    "totalCompletedWorks": sum(s["worksCompleted"] for s in states_list),
    "avgUtilizationPct": round(sum(s["utilizationPct"] for s in states_list) / len(states_list), 1),
    "highPerformersCount": sum(1 for s in states_list if s["performanceCategory"] == "High"),
    "avgPerformersCount": sum(1 for s in states_list if s["performanceCategory"] == "Average"),
    "needsImprovementCount": sum(1 for s in states_list if s["performanceCategory"] == "Needs Improvement")
}

states_js_content = f"""// Generated state performance data
export const ALL_STATES_PERFORMANCE = {json.dumps(states_list, indent=2)};

export const getNationalPerformanceSummary = () => ({json.dumps(national_summary, indent=2)});

export const getStateBySlug = (slug) => ALL_STATES_PERFORMANCE.find(s => s.slug === slug);
"""

with open(states_js_path, "w", encoding="utf-8") as f:
    f.write(states_js_content)


# ─── Generate indiaConstituencies.js ───
consts_js_content = f"""// Generated constituencies list mapping
export const INDIA_STATES_AND_UT = {json.dumps(states_list, indent=2)};
"""

with open(consts_js_path, "w", encoding="utf-8") as f:
    f.write(consts_js_content)


# ─── Generate mpPerformanceData.js ───
mps_list = []
mp_sno = 1
parties = ["BJP", "INC", "SP", "TMC", "DMK", "AAP", "JD(U)", "RJD", "IND"]
parties_hi = {
    "BJP": "भाजपा", "INC": "कांग्रेस", "SP": "सपा", "TMC": "तृणमूल कांग्रेस", 
    "DMK": "द्रमुक", "AAP": "आप", "JD(U)": "जद(यू)", "RJD": "राजद", "IND": "निर्दलीय"
}

for s in states_list:
    for c in s["constituencies"]:
        # Standard MPs
        # Pseudo-randomize per MP
        util_pct = 40 + (mp_sno * 13) % 56
        if util_pct > 100: util_pct = 98.4
        
        allocated = 5.0
        spent = round(allocated * (util_pct / 100), 2)
        works_rec = 20 + (mp_sno % 15)
        works_done = int(works_rec * (util_pct - 3) / 100)
        completion_rate = round((works_done / works_rec) * 100, 1)
        
        party = parties[mp_sno % len(parties)]
        
        mps_list.append({
            "id": f"MP-{1000 + mp_sno}",
            "name": f"MP {c['name']}",
            "slug": slugify(f"mp-{c['name']}"),
            "term": "18th LS" if mp_sno % 2 == 0 else "17th LS",
            "house": "Lok Sabha" if mp_sno % 4 != 0 else "Rajya Sabha",
            "state": s["state"],
            "constituency": c["name"],
            "allocatedCr": allocated,
            "spentCr": spent,
            "utilizationPct": round(util_pct, 1),
            "worksCompleted": works_done,
            "worksRecommended": works_rec,
            "completionRate": completion_rate,
            "party": party,
            "partyHi": parties_hi[party],
            "email": f"mp.{slugify(c['name'])}@sansad.nic.in",
            "phone": f"+91 98765 {10000 + mp_sno}"
        })
        mp_sno += 1

mps_js_content = f"""// Generated MP performance data
export const ALL_MPS_DATA = {json.dumps(mps_list, indent=2)};

export const mpToSlug = (name) => {{
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}};

export const getMpBySlug = (slug) => ALL_MPS_DATA.find(m => m.slug === slug);

export const getMpsSummaryStats = (mps) => {{
  const list = mps || ALL_MPS_DATA;
  if (list.length === 0) return {{
    totalAllocatedCr: 0,
    totalUtilizedCr: 0,
    avgUtilizationPct: 0,
    totalWorksCompleted: 0,
    highCount: 0,
    avgCount: 0,
    lowCount: 0
  }};
  
  const totalAllocated = list.reduce((sum, m) => sum + m.allocatedCr, 0);
  const totalUtilized = list.reduce((sum, m) => sum + m.spentCr, 0);
  const totalCompleted = list.reduce((sum, m) => sum + m.worksCompleted, 0);
  
  const high = list.filter(m => m.utilizationPct >= 70).length;
  const avg = list.filter(m => m.utilizationPct >= 40 && m.utilizationPct < 70).length;
  const low = list.filter(m => m.utilizationPct < 40).length;
  
  return {{
    totalAllocatedCr: roundVal(totalAllocated),
    totalUtilizedCr: roundVal(totalUtilized),
    avgUtilizationPct: roundVal((totalUtilized / (totalAllocated || 1)) * 100),
    totalWorksCompleted: totalCompleted,
    highCount: high,
    avgCount: avg,
    lowCount: low
  }};
}};

const roundVal = (v) => Math.round(v * 10) / 10;
"""

with open(mps_js_path, "w", encoding="utf-8") as f:
    f.write(mps_js_content)

print("SUCCESS: All performance data and constituency files successfully generated.")
