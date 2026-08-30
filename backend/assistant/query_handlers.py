"""
Nirikshak AI — Query Handlers
==================================
One handler per intent. Each handler retrieves data from the
repository, builds an evidence package, and returns a grounded response.
"""

import logging
from typing import Dict, Any, Optional, List

from backend.assistant.data_repository import DataRepository
from backend.assistant.entity_resolver import ResolvedEntities, extract_compare_entities
from backend.assistant.intent_router import Intent
from backend.assistant.glossary import find_glossary_entry, get_all_terms
from backend.assistant.response_builder import (
    build_project_risk_response,
    build_high_risk_list_response,
    build_anomaly_list_response,
    build_duplicate_response,
    build_mp_scorecard_response,
    build_compare_mps_response,
    build_constituency_response,
    build_vendor_response,
    build_geospatial_response,
    NO_DATA_MSG, NO_MATCH_MSG, DISCLAIMER, DISCLAIMER_SHORT,
    snapshot_msg,
)
from backend.assistant.schemas import AssistantQueryResponse, EvidenceItem, DataSnapshot

log = logging.getLogger("nirikshak.assistant.handlers")

MAX_RESULTS = 25
DEFAULT_RESULTS = 5


# ─── Handler Dispatch ────────────────────────────────────────────────────────

def handle_query(
    intent: str,
    message: str,
    entities: ResolvedEntities,
    repo: DataRepository,
    context: Optional[Dict] = None,
) -> AssistantQueryResponse:
    """Dispatch to the appropriate intent handler."""

    handlers = {
        Intent.HELP: handle_help,
        Intent.EXPLAIN_RISK: handle_explain_risk,
        Intent.FIND_HIGH_RISK: handle_find_high_risk,
        Intent.COST_DELAY: handle_cost_delay,
        Intent.DUPLICATES: handle_duplicates,
        Intent.MP_SCORECARD: handle_mp_scorecard,
        Intent.COMPARE_MPS: lambda m, e, r, c: handle_compare_mps(m, e, r, c),
        Intent.CONSTITUENCY_RISK: handle_constituency_risk,
        Intent.VENDOR_CONCENTRATION: handle_vendor_concentration,
        Intent.GEOSPATIAL: handle_geospatial,
        Intent.DEFINITION: handle_definition,
    }

    handler = handlers.get(intent, handle_unknown)

    try:
        response = handler(message, entities, repo, context)
    except Exception as e:
        log.error(f"Handler error for intent '{intent}': {e}", exc_info=True)
        response = AssistantQueryResponse(
            status="error",
            intent=intent,
            answer="I encountered an error processing your request. Please try rephrasing your question.",
            entities=entities.to_dict(),
            disclaimer=DISCLAIMER_SHORT,
        )

    # Attach snapshot info
    snap = repo.get_snapshot_info()
    response.data_snapshot = DataSnapshot(**snap) if snap else None
    response.intent = intent
    response.entities = entities.to_dict()

    return response


# ─── Help & Capabilities ────────────────────────────────────────────────────

def handle_help(
    message: str,
    entities: ResolvedEntities,
    repo: DataRepository,
    context: Optional[Dict],
) -> AssistantQueryResponse:
    """Handle help/capabilities questions."""
    snap = repo.get_snapshot_info()
    snap_text = f"\n\n📅 Data snapshot: {snap.get('generated_at', 'Unknown')}" if snap.get('generated_at') else ""

    answer = (
        "Namaste! I am the **Nirikshak AI Decision Support Assistant**. "
        "I can help you explore MPLADS risk intelligence using precomputed analytics.\n\n"
        "Here are some things you can ask me:\n\n"
        "🔍 **Project Risk**: \"Why is work 105744 high risk?\" or \"Explain the risk of this project.\"\n\n"
        "📊 **High-Risk Projects**: \"Show the top 5 high-risk projects in Bihar.\"\n\n"
        "💰 **Financial Anomalies**: \"Show cost anomalies in Uttar Pradesh\" or \"Which projects are delayed?\"\n\n"
        "🔄 **Duplicate Detection**: \"Find duplicate alerts involving work 158087.\"\n\n"
        "👤 **MP Scorecards**: \"Summarize the scorecard for an MP\" or \"Which MPs have the highest risk?\"\n\n"
        "📍 **Constituency Intelligence**: \"Summarize risk in Jabalpur\" or \"Show risk in Kerala.\"\n\n"
        "🏢 **Vendor Concentration**: \"Which vendors have high concentration risk?\" or \"What does HHI mean?\"\n\n"
        "🗺️ **Geospatial**: \"Show geographic risk clusters.\"\n\n"
        "📖 **Definitions**: \"What is a risk score?\" or \"Does a high HHI prove corruption?\"\n\n"
        "💡 You can also ask follow-up questions — I remember the context of our conversation."
        f"{snap_text}"
    )

    return AssistantQueryResponse(
        status="success",
        answer=answer,
        suggestions=[
            "Show the top 5 highest-risk projects",
            "Which MPs have the highest risk?",
            "What does risk score mean?",
            "Show cost anomalies in Bihar",
        ],
    )


# ─── Explain Project Risk ───────────────────────────────────────────────────

def handle_explain_risk(
    message: str,
    entities: ResolvedEntities,
    repo: DataRepository,
    context: Optional[Dict],
) -> AssistantQueryResponse:
    """Explain why a specific project is flagged."""
    work_id = entities.work_id
    if not work_id:
        return AssistantQueryResponse(
            status="success",
            answer="Please specify a work/project ID to explain. For example: \"Why is work 105744 high risk?\"",
            suggestions=["Why is work 105744 high risk?", "Show the top high-risk projects"],
        )

    # Look up the work
    record = repo.lookup_work(work_id)
    if not record:
        return AssistantQueryResponse(
            status="success",
            answer=f"I could not find work {work_id} in the current analytics snapshot. "
                   f"Please verify the work ID and try again.",
            suggestions=["Show the top high-risk projects"],
        )

    # Get additional data
    actual_wid = str(record.get("work_id", work_id))
    finguard = repo.lookup_finguard(actual_wid)
    duplicates = repo.lookup_duplicates(actual_wid)
    cost_delay = repo.lookup_cost_delay(actual_wid)

    result = build_project_risk_response(
        work_record=record,
        finguard_record=finguard,
        dup_records=duplicates,
        cost_delay_record=cost_delay,
    )

    return AssistantQueryResponse(
        status="success",
        answer=result["answer"],
        evidence=[EvidenceItem(**_dump_item(e)) for e in result["evidence"]],
        suggestions=result.get("suggestions", []),
        disclaimer=result.get("disclaimer"),
    )


# ─── Find High-Risk Projects ────────────────────────────────────────────────

def handle_find_high_risk(
    message: str,
    entities: ResolvedEntities,
    repo: DataRepository,
    context: Optional[Dict],
) -> AssistantQueryResponse:
    """Find and list high-risk projects with optional filters."""
    records = repo.get_high_risk_works(
        state=entities.state,
        constituency=entities.constituency,
        mp_name=entities.mp_name,
        limit=entities.limit,
    )

    filters = {
        "state": entities.state,
        "constituency": entities.constituency,
        "mp": entities.mp_name,
    }

    result = build_high_risk_list_response(records, filters)

    return AssistantQueryResponse(
        status="success",
        answer=result["answer"],
        evidence=[EvidenceItem(**_dump_item(e)) for e in result["evidence"]],
        suggestions=result.get("suggestions", []),
        disclaimer=result.get("disclaimer"),
    )


def _dump_item(e):
    if hasattr(e, 'model_dump'):
        return e.model_dump()
    elif hasattr(e, 'dict'):
        return e.dict()
    elif hasattr(e, '__dict__'):
        return e.__dict__
    return e


# ─── Cost & Delay Anomalies ─────────────────────────────────────────────────

def handle_cost_delay(
    message: str,
    entities: ResolvedEntities,
    repo: DataRepository,
    context: Optional[Dict],
) -> AssistantQueryResponse:
    """Handle cost/delay anomaly queries."""
    lower = message.lower()

    # If asking about a specific work
    if entities.work_id:
        work_id = entities.work_id
        cd_record = repo.lookup_cost_delay(work_id)
        fg_record = repo.lookup_finguard(work_id)

        if cd_record or fg_record:
            records = [r for r in [cd_record, fg_record] if r]
            source = "finguard" if fg_record and not cd_record else "cost_delay"
            result = build_anomaly_list_response(records, anomaly_type=source)
        else:
            return AssistantQueryResponse(
                status="success",
                answer=f"No cost or delay anomalies found for work {work_id}.",
                suggestions=["Show the top cost anomalies"],
            )
    else:
        # Check if asking specifically for delayed works
        if "delay" in lower or "delayed" in lower or "overdue" in lower or "stalled" in lower:
            min_days = 365 if ("year" in lower or "365" in lower) else 30
            records = repo.get_delayed_works(
                min_days=min_days,
                state=entities.state,
                constituency=entities.constituency,
                limit=entities.limit,
            )
            result = build_anomaly_list_response(records, anomaly_type="cost_delay")
        # Check if asking specifically for finguard
        elif "finguard" in lower or "financial" in lower or "ghost" in lower or "march" in lower:
            records = repo.get_finguard_anomalies(
                state=entities.state,
                constituency=entities.constituency,
                limit=entities.limit,
            )
            result = build_anomaly_list_response(records, anomaly_type="finguard")
        else:
            records = repo.get_high_risk_anomalies(
                state=entities.state,
                constituency=entities.constituency,
                limit=entities.limit,
            )
            result = build_anomaly_list_response(records, anomaly_type="cost_delay")

    return AssistantQueryResponse(
        status="success",
        answer=result["answer"],
        evidence=[EvidenceItem(**_dump_item(e)) for e in result["evidence"]],
        suggestions=result.get("suggestions", []),
        disclaimer=result.get("disclaimer"),
    )


# ─── Duplicate Alerts ───────────────────────────────────────────────────────

def handle_duplicates(
    message: str,
    entities: ResolvedEntities,
    repo: DataRepository,
    context: Optional[Dict],
) -> AssistantQueryResponse:
    """Handle duplicate project alert queries."""
    if entities.work_id:
        records = repo.lookup_duplicates(entities.work_id)
        records = records[:entities.limit]
        result = build_duplicate_response(records, target_work_id=entities.work_id)
    else:
        records = repo.get_top_duplicate_alerts(
            state=entities.state,
            limit=entities.limit,
        )
        result = build_duplicate_response(records)

    return AssistantQueryResponse(
        status="success",
        answer=result["answer"],
        evidence=[EvidenceItem(**_dump_item(e)) for e in result["evidence"]],
        suggestions=result.get("suggestions", []),
        disclaimer=result.get("disclaimer"),
    )


# ─── MP Scorecard ───────────────────────────────────────────────────────────

def handle_mp_scorecard(
    message: str,
    entities: ResolvedEntities,
    repo: DataRepository,
    context: Optional[Dict],
) -> AssistantQueryResponse:
    """Handle MP scorecard queries."""

    # Check for clarification
    if entities.clarification_needed and entities.clarification_type == "mp":
        return AssistantQueryResponse(
            status="success",
            answer="I found multiple MPs matching your query. Please select one:",
            clarification={
                "type": "mp_selection",
                "options": entities.clarification_options,
            },
            suggestions=entities.clarification_options[:3],
        )

    # Specific MP
    if entities.mp_name or entities.mp_id:
        record = None
        if entities.mp_id:
            record = repo.idx_mp_scorecard.get(entities.mp_id)
        if not record and entities.mp_name:
            results = repo.search_mp_by_name(entities.mp_name)
            if len(results) == 1:
                record = results[0][1]
            elif len(results) > 1:
                return AssistantQueryResponse(
                    status="success",
                    answer="I found multiple MPs matching your query. Please select one:",
                    clarification={
                        "type": "mp_selection",
                        "options": [r[0] for r in results[:5]],
                    },
                    suggestions=[r[0] for r in results[:3]],
                )

        if record:
            result = build_mp_scorecard_response(record)
            return AssistantQueryResponse(
                status="success",
                answer=result["answer"],
                evidence=[EvidenceItem(**_dump_item(e)) for e in result["evidence"]],
                suggestions=result.get("suggestions", []),
                disclaimer=result.get("disclaimer"),
            )

        return AssistantQueryResponse(
            status="success",
            answer=f"I could not find an MP matching '{entities.mp_name or entities.mp_id}' in the current scorecard data.",
            suggestions=["Which MPs have the highest risk?"],
        )

    # Top MPs by risk
    lower = message.lower()
    sort_by = "risk" if any(w in lower for w in ["risk", "worst", "lowest", "highest risk"]) else "risk"

    records = repo.get_top_mp_scorecards(
        state=entities.state,
        limit=entities.limit,
        sort_by=sort_by,
    )

    if not records:
        return AssistantQueryResponse(
            status="success",
            answer="No MP scorecard data available for the specified criteria.",
            suggestions=["Which MPs have the highest risk?"],
        )

    evidence = []
    lines = [f"**Top {len(records)} MPs by Risk** (lowest integrity score):"]
    for i, rec in enumerate(records, 1):
        name = rec.get("mp_name", "?")
        score = rec.get("composite_integrity_score", "?")
        works = rec.get("total_works", 0)
        state = rec.get("state_name", "")
        lines.append(f"\n**{i}. {name}**\n   Integrity: {score} | Works: {works} | {state}")
        evidence.append(EvidenceItem(
            label=f"MP #{i}", value=f"{name} — Integrity: {score}",
            source="MP Scorecard Summary", record_id=str(rec.get("mp_id")),
        ))

    return AssistantQueryResponse(
        status="success",
        answer="\n".join(lines),
        evidence=evidence,
        suggestions=[
            f"Summarize the scorecard for {records[0].get('mp_name', '').split('(')[0].strip()}",
            "Compare two MPs",
        ],
        disclaimer=DISCLAIMER_SHORT,
    )


# ─── Compare MPs ────────────────────────────────────────────────────────────

def handle_compare_mps(
    message: str,
    entities: ResolvedEntities,
    repo: DataRepository,
    context: Optional[Dict],
) -> AssistantQueryResponse:
    """Handle MP comparison."""
    compared = extract_compare_entities(message, repo)

    if len(compared) < 2:
        return AssistantQueryResponse(
            status="success",
            answer="Please specify two MP names to compare. For example: \"Compare MP Rajiv Pratap Rudy and MP Ashwini Vaishnaw.\"",
            suggestions=["Which MPs have the highest risk?"],
        )

    records = [c["record"] for c in compared]
    result = build_compare_mps_response(records)

    return AssistantQueryResponse(
        status="success",
        answer=result["answer"],
        evidence=[EvidenceItem(**_dump_item(e)) for e in result["evidence"]],
        suggestions=result.get("suggestions", []),
        disclaimer=result.get("disclaimer"),
    )


# ─── Constituency Risk ──────────────────────────────────────────────────────

def handle_constituency_risk(
    message: str,
    entities: ResolvedEntities,
    repo: DataRepository,
    context: Optional[Dict],
) -> AssistantQueryResponse:
    """Handle constituency risk queries."""

    # Specific constituency
    if entities.constituency:
        c_lower = entities.constituency.lower()
        risk_rec = repo.idx_constituency_risk.get(c_lower)
        hhi_rec = repo.idx_constituency_hhi.get(c_lower)
        fg_rec = repo.idx_finguard_constituency.get(c_lower)
        geo_rec = repo.idx_geo_constituency.get(c_lower)

        if risk_rec or hhi_rec or fg_rec or geo_rec:
            result = build_constituency_response(
                risk_record=risk_rec,
                hhi_record=hhi_rec,
                finguard_record=fg_rec,
                geo_record=geo_rec,
                constituency_name=entities.constituency,
            )
            return AssistantQueryResponse(
                status="success",
                answer=result["answer"],
                evidence=[EvidenceItem(**_dump_item(e)) for e in result["evidence"]],
                suggestions=result.get("suggestions", []),
                disclaimer=result.get("disclaimer"),
            )

        # Check if matching works exist under IDA, constituency, or description
        matching_works = repo.idx_constituency.get(c_lower, [])
        if not matching_works:
            for rec in repo._cache.get("unified_evaluations", []):
                ida = (rec.get("ida_name") or "").lower()
                desc = (rec.get("work_description") or "").lower()
                if c_lower in ida or c_lower in desc:
                    matching_works.append(rec)

        if matching_works:
            total_w = len(matching_works)
            high_risk_w = sum(1 for w in matching_works if w.get("is_high_risk"))
            state = matching_works[0].get("state_name", "")
            sanctioned = sum(w.get("sanction_amount") or 0 for w in matching_works)
            spent = sum(w.get("actual_amount") or w.get("total_disbursed") or 0 for w in matching_works)
            
            dyn_risk_rec = {
                "const_name": entities.constituency.title(),
                "state_name": state,
                "total_projects": total_w,
                "high_risk_projects": high_risk_w,
                "total_sanctioned": sanctioned,
                "total_spent": spent,
            }
            result = build_constituency_response(
                risk_record=dyn_risk_rec,
                constituency_name=entities.constituency.title(),
            )
            return AssistantQueryResponse(
                status="success",
                answer=result["answer"],
                evidence=[EvidenceItem(**_dump_item(e)) for e in result["evidence"]],
                suggestions=result.get("suggestions", []),
                disclaimer=result.get("disclaimer"),
            )

        # Try fuzzy match
        matches = repo.search_constituency(entities.constituency)
        if matches:
            if len(matches) == 1:
                entities.constituency = matches[0][0]
                return handle_constituency_risk(
                    message, entities, repo, context,
                )
            return AssistantQueryResponse(
                status="success",
                answer=f"I found multiple constituencies matching '{entities.constituency}'. Please select one:",
                clarification={
                    "type": "constituency_selection",
                    "options": [m[0] for m in matches[:5]],
                },
                suggestions=[m[0] for m in matches[:3]],
            )

        return AssistantQueryResponse(
            status="success",
            answer=f"I could not find constituency '{entities.constituency}' in the current analytics snapshot.",
            suggestions=["Which constituencies have the most high-risk works?"],
        )

    # Top constituencies by risk
    risk_data = repo.get_artifact("constituency_risk") or []
    sorted_data = sorted(risk_data, key=lambda r: -(r.get("high_risk_projects", 0)))[:entities.limit]

    if not sorted_data:
        return AssistantQueryResponse(
            status="success",
            answer=NO_DATA_MSG,
            suggestions=["Show risk in Jabalpur"],
        )

    evidence = []
    lines = [f"**Top {len(sorted_data)} Constituencies by High-Risk Projects:**"]
    for i, rec in enumerate(sorted_data, 1):
        name = rec.get("const_name", "?")
        state = rec.get("state_name", "")
        high_risk = rec.get("high_risk_projects", 0)
        total = rec.get("total_projects", 0)
        lines.append(f"\n**{i}. {name}** ({state})\n   High-Risk: {high_risk}/{total}")
        evidence.append(EvidenceItem(
            label=f"Constituency #{i}",
            value=f"{name}: {high_risk} high-risk out of {total}",
            source="Constituency Risk Heatmap",
            record_id=name,
        ))

    return AssistantQueryResponse(
        status="success",
        answer="\n".join(lines),
        evidence=evidence,
        suggestions=["Summarize risk in " + sorted_data[0].get("const_name", "")],
        disclaimer=DISCLAIMER_SHORT,
    )


# ─── Vendor Concentration ───────────────────────────────────────────────────

def handle_vendor_concentration(
    message: str,
    entities: ResolvedEntities,
    repo: DataRepository,
    context: Optional[Dict],
) -> AssistantQueryResponse:
    """Handle vendor concentration queries."""

    # Specific vendor
    if entities.vendor:
        v_lower = entities.vendor.lower()
        vrec = repo.idx_vendor_network.get(v_lower)
        if vrec:
            result = build_vendor_response([vrec])
            return AssistantQueryResponse(
                status="success",
                answer=result["answer"],
                evidence=[EvidenceItem(**_dump_item(e)) for e in result["evidence"]],
                suggestions=result.get("suggestions", []),
                disclaimer=result.get("disclaimer"),
            )

    # HHI for a constituency
    if entities.constituency:
        c_lower = entities.constituency.lower()
        hhi_rec = repo.idx_constituency_hhi.get(c_lower)
        if hhi_rec:
            hhi = hhi_rec.get("hhi", 0)
            level = "Low" if hhi < 1500 else ("Moderate" if hhi < 2500 else "High")
            dominant = hhi_rec.get("dominant_vendor", "N/A")
            share = hhi_rec.get("dominant_vendor_share", 0)

            answer = (
                f"**Vendor Concentration in {entities.constituency}:**\n\n"
                f"📊 HHI Score: **{hhi:.0f}** ({level} concentration)\n"
                f"🏢 Dominant Vendor: {dominant} ({share:.1f}% share)\n"
                f"📋 Total Vendors: {hhi_rec.get('total_vendors', 'N/A')}\n\n"
                f"⚠️ A high HHI indicates fewer vendors hold larger shares of work. "
                f"This is a structural observation, not evidence of wrongdoing."
            )

            return AssistantQueryResponse(
                status="success",
                answer=answer,
                evidence=[
                    EvidenceItem(label="HHI Score", value=f"{hhi:.0f} ({level})",
                                 source="Constituency HHI", record_id=entities.constituency),
                    EvidenceItem(label="Dominant Vendor", value=f"{dominant} ({share:.1f}%)",
                                 source="Constituency HHI", record_id=entities.constituency),
                ],
                suggestions=["What does HHI mean?", f"Show risk in {entities.constituency}"],
                disclaimer="Vendor concentration is a structural observation requiring verification.",
            )

    # Top vendors overall
    network_records = repo.get_vendor_network_top(limit=entities.limit)
    result = build_vendor_response(network_records)

    return AssistantQueryResponse(
        status="success",
        answer=result["answer"],
        evidence=[EvidenceItem(**_dump_item(e)) for e in result["evidence"]],
        suggestions=result.get("suggestions", []),
        disclaimer=result.get("disclaimer"),
    )


# ─── Geospatial Intelligence ────────────────────────────────────────────────

def handle_geospatial(
    message: str,
    entities: ResolvedEntities,
    repo: DataRepository,
    context: Optional[Dict],
) -> AssistantQueryResponse:
    """Handle geospatial intelligence queries."""

    # Specific constituency geo data
    if entities.constituency:
        c_lower = entities.constituency.lower()
        geo_rec = repo.idx_geo_constituency.get(c_lower)
        if geo_rec:
            spatial_risk = geo_rec.get("spatial_risk_score", 0)
            cluster_id = geo_rec.get("cluster_id")
            total = geo_rec.get("total_projects", 0)
            high_risk = geo_rec.get("high_risk_projects", 0)
            coords = geo_rec.get("coordinates")

            answer = (
                f"**Geospatial Intelligence: {entities.constituency}**\n\n"
                f"🗺️ Spatial Risk Score: {spatial_risk:.4f}\n"
                f"📊 Projects: {total} total, {high_risk} high-risk\n"
                f"🔗 Geographic Cluster: {cluster_id}"
            )
            if coords:
                answer += f"\n📍 Coordinates: [{coords[0]:.4f}, {coords[1]:.4f}]"

            return AssistantQueryResponse(
                status="success",
                answer=answer,
                evidence=[
                    EvidenceItem(label="Spatial Risk", value=f"{spatial_risk:.4f}",
                                 source="Geospatial Intelligence", record_id=entities.constituency),
                    EvidenceItem(label="Cluster ID", value=str(cluster_id),
                                 source="Geospatial Intelligence", record_id=entities.constituency),
                ],
                suggestions=[f"Show risk in {entities.constituency}"],
                disclaimer=DISCLAIMER_SHORT,
            )

    # All geo data - show clusters
    geo_data = repo.get_artifact("geointel_heatmap")
    if geo_data and isinstance(geo_data, dict):
        features = geo_data.get("features", [])
        geo_records = [
            {**f.get("properties", {}), "coordinates": f.get("geometry", {}).get("coordinates")}
            for f in features
        ]
        result = build_geospatial_response(geo_records)
    else:
        result = build_geospatial_response([])

    return AssistantQueryResponse(
        status="success",
        answer=result["answer"],
        evidence=[EvidenceItem(**_dump_item(e)) for e in result["evidence"]],
        suggestions=result.get("suggestions", []),
        disclaimer=result.get("disclaimer"),
    )


# ─── Definition / Glossary ──────────────────────────────────────────────────

def handle_definition(
    message: str,
    entities: ResolvedEntities,
    repo: DataRepository,
    context: Optional[Dict],
) -> AssistantQueryResponse:
    """Handle glossary/definition queries."""
    entry = find_glossary_entry(message)

    if entry:
        answer = f"**{entry['term']}**\n\n{entry['definition']}"
        return AssistantQueryResponse(
            status="success",
            answer=answer,
            evidence=[EvidenceItem(
                label="Glossary",
                value=entry["term"],
                source="Nirikshak AI Glossary",
            )],
            suggestions=[
                "What is HHI?",
                "Does a high HHI prove corruption?",
                "What is a risk score?",
            ],
        )

    # List available terms
    terms = get_all_terms()
    answer = (
        "I don't have a specific definition for that term. "
        "Here are the analytical terms I can explain:\n\n"
        + "\n".join(f"• {t}" for t in terms)
    )

    return AssistantQueryResponse(
        status="success",
        answer=answer,
        suggestions=["What is HHI?", "What is a risk score?", "What is duplicate similarity?"],
    )


# ─── Unknown Intent ─────────────────────────────────────────────────────────

def handle_unknown(
    message: str,
    entities: ResolvedEntities,
    repo: DataRepository,
    context: Optional[Dict],
) -> AssistantQueryResponse:
    """Handle unrecognized queries."""
    return AssistantQueryResponse(
        status="success",
        intent=Intent.UNKNOWN,
        answer=(
            "I'm not sure I understand that question. I can help with:\n\n"
            "• **Project risk explanations** — \"Why is work 105744 high risk?\"\n"
            "• **High-risk project lists** — \"Show top 5 high-risk projects in Bihar\"\n"
            "• **Cost/delay anomalies** — \"Show extreme cost anomalies\"\n"
            "• **Duplicate detection** — \"Find duplicate alerts for work 158087\"\n"
            "• **MP scorecards** — \"Which MPs have the highest risk?\"\n"
            "• **Constituency intelligence** — \"Summarize risk in Jabalpur\"\n"
            "• **Vendor concentration** — \"Show vendors with high concentration\"\n"
            "• **Definitions** — \"What does HHI mean?\"\n\n"
            "Please try rephrasing your question."
        ),
        suggestions=[
            "What can you help me with?",
            "Show the top 5 highest-risk projects",
            "What does HHI mean?",
        ],
    )
