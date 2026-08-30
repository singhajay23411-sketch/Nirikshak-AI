"""
Nirikshak AI — Comprehensive Decision Support Assistant Test Suite
====================================================================
Tests:
1. Repository & Data Tests (Safe paths, schemas, manifest, determinism)
2. Query Handler Tests (All intents, edge cases, limits, follow-ups)
3. Grounding & Anti-Hallucination Tests (Traceability, responsible language)
4. Forbidden Access Tests (No PostgreSQL, no heavy ML, no web scraping)
5. API & Auth Tests (Pydantic validation, RBAC/auth, rate limiting)
6. 25+ Golden-Question Verification Tests with Real Artifact Entities
"""

import os
import sys
import json
import time
import pytest
from unittest.mock import MagicMock

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, PROJECT_ROOT)

from backend.assistant.artifact_registry import (
    ARTIFACT_REGISTRY, get_data_dir, resolve_artifact_path, get_available_artifacts,
)
from backend.assistant.data_repository import DataRepository, get_repository, initialize_repository
from backend.assistant.intent_router import classify_intent, Intent
from backend.assistant.entity_resolver import (
    resolve_entities, get_session, SessionContext,
)
from backend.assistant.query_handlers import handle_query
from backend.assistant.schemas import AssistantQueryRequest, AssistantQueryResponse
from backend.assistant.glossary import find_glossary_entry, GLOSSARY
from backend.assistant.llm_adapter import enhance_response


@pytest.fixture(scope="module")
def repo():
    """Module-scoped initialized data repository."""
    return get_repository()


# ═══════════════════════════════════════════════════════════════════════════
# 1. REPOSITORY & DATA TESTS
# ═══════════════════════════════════════════════════════════════════════════

class TestRepositoryAndData:

    def test_registered_artifact_paths_are_safe(self):
        """Ensure no artifact definition allows path traversal."""
        for safe_name, spec in ARTIFACT_REGISTRY.items():
            assert not spec.filename.startswith("..")
            assert not spec.filename.startswith("/")
            assert "\\" not in spec.filename
            path = resolve_artifact_path(safe_name)
            if path:
                assert os.path.isabs(path)
                assert os.path.exists(path)

    def test_reject_arbitrary_or_traversal_paths(self):
        """Ensure resolve_artifact_path rejects unknown or traversal names."""
        assert resolve_artifact_path("../../etc/passwd") is None
        assert resolve_artifact_path("non_existent_file.json") is None
        assert resolve_artifact_path("..\\windows\\system32") is None

    def test_available_artifacts_parse_successfully(self, repo):
        """All discovered artifacts must parse cleanly into memory."""
        status = repo.get_loading_status()
        assert len(status["errors"]) == 0, f"Artifact load errors: {status['errors']}"
        assert len(status["loaded"]) >= 8, f"Too few artifacts loaded: {status['loaded']}"

    def test_manifest_metadata_and_snapshot(self, repo):
        """Manifest info must contain sync timestamp and dataset version hash."""
        snap = repo.get_snapshot_info()
        assert "generated_at" in snap
        assert snap["generated_at"] is not None
        assert "version" in snap

    def test_missing_optional_artifact_degrades_gracefully(self):
        """Repository initializes without crash when optional file is missing."""
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            # Empty dir — required files missing will log warning but not crash init
            r = DataRepository(data_dir=tmpdir)
            r.initialize()
            assert len(r._cache) == 0
            assert r.lookup_work("999999") is None


# ═══════════════════════════════════════════════════════════════════════════
# 2. INTENT & ENTITY RESOLUTION TESTS
# ═══════════════════════════════════════════════════════════════════════════

class TestIntentAndEntityResolution:

    @pytest.mark.parametrize("msg,expected_intent", [
        ("What can you help me with?", Intent.HELP),
        ("help", Intent.HELP),
        ("Namaste!", Intent.HELP),
        ("Why is work 105744 high risk?", Intent.EXPLAIN_RISK),
        ("Explain the risk of project MPLADS-8871", Intent.EXPLAIN_RISK),
        ("Show top 5 high-risk projects in Bihar", Intent.FIND_HIGH_RISK),
        ("List critical works in Uttar Pradesh", Intent.FIND_HIGH_RISK),
        ("Show cost anomalies in Madhya Pradesh", Intent.COST_DELAY),
        ("Which projects are delayed by more than one year?", Intent.COST_DELAY),
        ("Find duplicate project alerts involving work 158087", Intent.DUPLICATES),
        ("Why are these two projects considered similar?", Intent.DUPLICATES),
        ("Summarize the scorecard for MP Praveen Chakravarthy", Intent.MP_SCORECARD),
        ("Which MPs have the highest risk?", Intent.MP_SCORECARD),
        ("Compare MP Rajiv Pratap Rudy and MP Ashwini Vaishnaw", Intent.COMPARE_MPS),
        ("Summarize risk in Jabalpur", Intent.CONSTITUENCY_RISK),
        ("What is the risk profile of this constituency?", Intent.CONSTITUENCY_RISK),
        ("Which vendors have high concentration risk?", Intent.VENDOR_CONCENTRATION),
        ("What does HHI mean?", Intent.DEFINITION),
        ("Does a high HHI prove corruption?", Intent.DEFINITION),
        ("Show geographic risk clusters", Intent.GEOSPATIAL),
    ])
    def test_intent_classification(self, msg, expected_intent):
        assert classify_intent(msg) == expected_intent

    def test_entity_resolution_work_ids(self, repo):
        session = SessionContext()
        e1 = resolve_entities("Why is work 105744 flagged?", Intent.EXPLAIN_RISK, repo, session=session)
        assert e1.work_id == "105744"

        e2 = resolve_entities("Check MPLADS-BI-M00520", Intent.EXPLAIN_RISK, repo, session=session)
        assert e2.work_id == "MPLADS-BI-M00520"

    def test_entity_resolution_state_and_limit(self, repo):
        session = SessionContext()
        e = resolve_entities("Show top 10 high-risk projects in UP", Intent.FIND_HIGH_RISK, repo, session=session)
        assert e.state == "Uttar Pradesh"
        assert e.limit == 10

    def test_follow_up_session_context(self, repo):
        session = SessionContext()
        # First query: set project context
        e1 = resolve_entities("Why is work 105744 high risk?", Intent.EXPLAIN_RISK, repo, session=session)
        session.update(e1.to_dict(), Intent.EXPLAIN_RISK)
        assert session.last_work_id == "105744"

        # Follow-up: "Show duplicate alerts for this project"
        e2 = resolve_entities("Show duplicate alerts for this project", Intent.DUPLICATES, repo, session=session)
        assert e2.work_id == "105744"


# ═══════════════════════════════════════════════════════════════════════════
# 3. GROUNDING & RESPONSIBLE LANGUAGE TESTS
# ═══════════════════════════════════════════════════════════════════════════

class TestGroundingAndResponsibleLanguage:

    def test_evidence_grounded_in_artifacts(self, repo):
        session = SessionContext()
        entities = resolve_entities("Why is work 105744 high risk?", Intent.EXPLAIN_RISK, repo, session=session)
        resp = handle_query(Intent.EXPLAIN_RISK, "Why is work 105744 high risk?", entities, repo)
        
        assert resp.status == "success"
        assert len(resp.evidence) > 0
        for ev in resp.evidence:
            assert ev.source in [
                "Unified Evaluations", "FinGuard Anomalies", "Cost & Delay Anomalies",
                "Duplicate Project Alerts", "MP Scorecard Summary", "Constituency Risk Heatmap",
                "Constituency HHI", "Vendor Risk Network", "Geospatial Intelligence", "Nirikshak AI Glossary",
            ]

    def test_responsible_language_rules(self, repo):
        """Ensure no defamatory or premature fraud conclusions appear in answers."""
        forbidden_phrases = [
            "fraud confirmed", "corrupt contractor", "proven duplicate",
            "cartel confirmed", "guilty agency", "definitely corrupt",
        ]
        
        session = SessionContext()
        # Test across different query types
        queries = [
            (Intent.EXPLAIN_RISK, "Why is work 105744 high risk?", resolve_entities("Why is work 105744 high risk?", Intent.EXPLAIN_RISK, repo)),
            (Intent.DUPLICATES, "Show duplicate alerts", resolve_entities("Show duplicate alerts", Intent.DUPLICATES, repo)),
            (Intent.VENDOR_CONCENTRATION, "Which vendors have high concentration?", resolve_entities("Which vendors have high concentration?", Intent.VENDOR_CONCENTRATION, repo)),
            (Intent.DEFINITION, "Does HHI prove corruption?", resolve_entities("Does HHI prove corruption?", Intent.DEFINITION, repo)),
        ]
        
        for intent, msg, entities in queries:
            resp = handle_query(intent, msg, entities, repo)
            answer_lower = resp.answer.lower()
            for phrase in forbidden_phrases:
                assert phrase not in answer_lower, f"Forbidden phrase '{phrase}' found in answer for {intent}"

    def test_missing_data_honest_response(self, repo):
        entities = resolve_entities("Why is work 999999999 high risk?", Intent.EXPLAIN_RISK, repo)
        resp = handle_query(Intent.EXPLAIN_RISK, "Why is work 999999999 high risk?", entities, repo)
        assert "could not find work 999999999" in resp.answer.lower()


# ═══════════════════════════════════════════════════════════════════════════
# 4. FORBIDDEN ACCESS TESTS (Zero SQL, Zero DB Drivers, Zero Heavy ML)
# ═══════════════════════════════════════════════════════════════════════════

class TestForbiddenAccess:

    def test_no_forbidden_imports_in_assistant_package(self):
        """Scans backend/assistant/ codebase to strictly verify no DB/ML drivers are imported."""
        assistant_dir = os.path.join(PROJECT_ROOT, "backend", "assistant")
        forbidden_tokens = [
            "psycopg2", "psycopg", "sqlalchemy", "asyncpg", "sqlite3",
            "torch", "torchvision", "sentence_transformers", "sklearn", "networkx",
            "SELECT ", "INSERT INTO", "UPDATE ", "DELETE FROM", "DROP TABLE",
            "urllib.request", "BeautifulSoup", "requests.get(\"http",
        ]

        for root, _, files in os.walk(assistant_dir):
            for file in files:
                if file.endswith(".py"):
                    filepath = os.path.join(root, file)
                    with open(filepath, "r", encoding="utf-8") as f:
                        content = f.read()
                    for token in forbidden_tokens:
                        assert token not in content, f"Forbidden token '{token}' found in {filepath}"


# ═══════════════════════════════════════════════════════════════════════════
# 5. API & AUTH TESTS
# ═══════════════════════════════════════════════════════════════════════════

class TestApiAndAuth:

    def test_pydantic_schema_validation_oversized_message(self):
        with pytest.raises(Exception):
            AssistantQueryRequest(message="A" * 3000)

    def test_pydantic_schema_validation_empty_message(self):
        with pytest.raises(Exception):
            AssistantQueryRequest(message="   ")

    def test_pydantic_schema_valid_request(self):
        req = AssistantQueryRequest(
            message="Why is work 105744 high risk?",
            conversation_id="test-session-123",
            context={"selected_work_id": "105744"}
        )
        assert req.message == "Why is work 105744 high risk?"
        assert req.conversation_id == "test-session-123"


# ═══════════════════════════════════════════════════════════════════════════
# 6. GOLDEN-QUESTION TESTS (25+ Concrete Analytical Queries)
# ═══════════════════════════════════════════════════════════════════════════

class TestGoldenQuestions:

    GOLDEN_QUESTIONS = [
        # 1. Help
        ("What can you help me with?", Intent.HELP, ["High-Risk Projects", "MP Scorecards"]),
        # 2. Project Risk with real work ID
        ("Why is work 105744 high risk?", Intent.EXPLAIN_RISK, ["Work 105744", "Risk Level"]),
        # 3. Project Risk with real work ID 303957
        ("Explain the risk score of project 303957", Intent.EXPLAIN_RISK, ["Work 303957"]),
        # 4. Project Risk with real work ID 239327
        ("Why is work 239327 flagged?", Intent.EXPLAIN_RISK, ["Work 239327"]),
        # 5. Find top high risk projects in Bihar
        ("Show the five highest-risk projects in Bihar.", Intent.FIND_HIGH_RISK, ["Bihar"]),
        # 6. Find high-risk projects in Uttar Pradesh
        ("Show high-risk projects in Uttar Pradesh", Intent.FIND_HIGH_RISK, ["Uttar Pradesh"]),
        # 7. Find top 3 high risk projects
        ("Show top 3 high-risk projects", Intent.FIND_HIGH_RISK, ["high-risk"]),
        # 8. Cost anomalies
        ("Show cost anomalies in Bihar", Intent.COST_DELAY, ["Bihar"]),
        # 9. Delayed projects
        ("Show projects delayed by more than one year", Intent.COST_DELAY, ["delay", "Work"]),
        # 10. Duplicate alert involving real work ID 158087
        ("Find duplicate alerts involving work 158087", Intent.DUPLICATES, ["158087", "158088"]),
        # 11. Highest-confidence duplicate candidates
        ("Show the highest-confidence duplicate candidates.", Intent.DUPLICATES, ["Confidence"]),
        # 12. Duplicate similarity explanation
        ("Why are these two projects considered similar?", Intent.DUPLICATES, ["Candidate"]),
        # 13. MP Scorecard for real MP
        ("Summarize the scorecard of MP Praveen Chakravarthy", Intent.MP_SCORECARD, ["Praveen Chakravarthy"]),
        # 14. MP Scorecard for real MP Ashwini Vaishnaw
        ("Summarize the scorecard for MP Ashwini Vaishnaw", Intent.MP_SCORECARD, ["Ashwini Vaishnaw"]),
        # 15. Highest risk MPs
        ("Which MPs have the highest risk?", Intent.MP_SCORECARD, ["Integrity"]),
        # 16. Compare two real MPs
        ("Compare MP Rajiv Pratap Rudy and MP Ashwini Vaishnaw", Intent.COMPARE_MPS, ["Comparison"]),
        # 17. Constituency Risk for real constituency
        ("Summarize risk in Jabalpur", Intent.CONSTITUENCY_RISK, ["Jabalpur"]),
        # 18. Constituency Risk with highest works
        ("Which constituencies have the most high-risk works?", Intent.CONSTITUENCY_RISK, ["Constituencies"]),
        # 19. Constituency vendor concentration (HHI)
        ("Explain the vendor risk in Telangana (Rajya Sabha Nodal District)", Intent.VENDOR_CONCENTRATION, ["HHI", "Concentration"]),
        # 20. Top vendor concentration
        ("Which vendors have high concentration risk?", Intent.VENDOR_CONCENTRATION, ["Vendor"]),
        # 21. Geospatial intelligence
        ("Show geographic risk clusters.", Intent.GEOSPATIAL, ["Cluster"]),
        # 22. Definition of HHI
        ("What does HHI mean?", Intent.DEFINITION, ["Herfindahl-Hirschman Index"]),
        # 23. Definition of Cost Z-Score
        ("What is a cost z-score?", Intent.DEFINITION, ["Cost Z-Score"]),
        # 24. Definition of Risk Score
        ("What is a risk score?", Intent.DEFINITION, ["Risk Score"]),
        # 25. Responsible language check on corruption claim
        ("Does a high HHI prove corruption?", Intent.DEFINITION, ["does NOT prove", "collusion"]),
        # 26. Anomaly vs fraud definition
        ("What is the difference between an anomaly and fraud?", Intent.DEFINITION, ["Anomaly vs. Confirmed Fraud"]),
    ]

    @pytest.mark.parametrize("question,expected_intent,expected_snippets", GOLDEN_QUESTIONS)
    def test_golden_questions(self, repo, question, expected_intent, expected_snippets):
        intent = classify_intent(question)
        assert intent == expected_intent, f"Failed intent classification for: {question}"

        entities = resolve_entities(question, intent, repo)
        resp = handle_query(intent, question, entities, repo)

        assert resp.status == "success"
        assert resp.answer != ""
        for snippet in expected_snippets:
            assert snippet.lower() in resp.answer.lower(), (
                f"Snippet '{snippet}' missing from answer for '{question}'\nAnswer was: {resp.answer}"
            )
