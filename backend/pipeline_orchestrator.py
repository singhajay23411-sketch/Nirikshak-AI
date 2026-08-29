import os
import sys
import time
import argparse
import subprocess
import json
import logging
from typing import List, Dict, Any

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("orchestrator")

# Define target paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "frontend", "public", "data")

# Stage Command Definitions
STAGES = {
    "sync": {
        "name": "Stage 1: Incremental Ingestion",
        "command": ["-m", "backend.sync_incremental"]
    },
    "features": {
        "name": "Stage 2: Feature Engineering",
        "command": ["-m", "ai_models.feature_builder"]
    },
    "stall": {
        "name": "Stage 3.1: Train Stall Classifier",
        "command": ["-m", "ai_models.stall_predictor"]
    },
    "finguard": {
        "name": "Stage 3.2: FinGuard Risk Assessment",
        "command": ["-m", "ai_models.finguard"]
    },
    "duplicate": {
        "name": "Stage 3.3: Duplicate Project Detection",
        "command": ["-m", "ai_models.duplicate_detector"]
    },
    "vendor": {
        "name": "Stage 3.4: Vendor Cartel Analysis",
        "command": ["-m", "ai_models.vendor_network"]
    },
    "unified_risk": {
        "name": "Stage 3.5: Unified Risk Composite Scoring",
        "command": ["-m", "ai_models.unified_risk_engine"]
    },
    "export_live": {
        "name": "Stage 4.1: Export Live Results",
        "command": ["-m", "backend.export_live_results"]
    },
    "export_perf": {
        "name": "Stage 4.2: Generate Real Performance Mappings",
        "command": ["scripts/generate_real_performance_data.py"]
    },
    "export_projects": {
        "name": "Stage 4.3: Export Real Projects Fallback Feed",
        "command": ["scripts/export_real_projects.py"]
    }
}

def execute_subprocess(args: List[str]) -> bool:
    """Execute a python module or script as a subprocess, streaming output to console."""
    cmd = [sys.executable] + args
    env = os.environ.copy()
    env["PYTHONPATH"] = PROJECT_ROOT
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            cwd=PROJECT_ROOT,
            env=env
        )
        # Stream stdout line by line
        if process.stdout:
            for line in process.stdout:
                sys.stdout.write("  " + line)
                sys.stdout.flush()
        process.wait()
        return process.returncode == 0
    except Exception as e:
        logger.error(f"Execution failed for command {cmd}: {e}")
        return False

def format_size(bytes_size: int) -> str:
    """Format bytes size to human-readable string."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.2f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.2f} TB"

def collect_metrics() -> Dict[str, Any]:
    """Gather overall processing and anomaly statistics from exported files."""
    metrics = {
        "total_projects": 0,
        "duplicate_alerts": 0,
        "stalled_projects": 0,
        "finguard_anomalies": 0,
        "high_risk_projects": 0
    }
    
    # 1. Total projects in projects feed
    real_projects_path = os.path.join(DATA_DIR, "real_projects.json")
    if os.path.exists(real_projects_path):
        try:
            with open(real_projects_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                metrics["total_projects"] = len(data)
        except Exception:
            pass
            
    # 2. Duplicate Alerts
    dups_path = os.path.join(DATA_DIR, "duplicate_project_alerts.json")
    if os.path.exists(dups_path):
        try:
            with open(dups_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                metrics["duplicate_alerts"] = len(data)
        except Exception:
            pass

    # 3. FinGuard anomalies
    finguard_path = os.path.join(DATA_DIR, "finguard_anomalies.json")
    if os.path.exists(finguard_path):
        try:
            with open(finguard_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                metrics["finguard_anomalies"] = len(data)
        except Exception:
            pass

    # 4. High Risk Projects
    eval_path = os.path.join(DATA_DIR, "unified_project_evaluations.json")
    if os.path.exists(eval_path):
        try:
            with open(eval_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                # Count projects with unified_risk_score > 70 or risk_tier == 'High'
                high_risk_count = 0
                for item in data.values():
                    if isinstance(item, dict):
                        score = item.get("unified_risk_score", 0)
                        tier = item.get("risk_tier", "")
                        if score > 70 or tier.lower() == "high":
                            high_risk_count += 1
                metrics["high_risk_projects"] = high_risk_count
        except Exception:
            pass
            
    return metrics

def run_pipeline():
    parser = argparse.ArgumentParser(description="Nirikshak AI Multi-Stage End-to-End Analytics & Sync Orchestrator")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--all", action="store_true", help="Run Stages 1 through 4 end-to-end (full cycle)")
    group.add_argument("--skip-scrape", action="store_true", help="Bypass Stage 1 incremental scraping and recompute ML using current database")
    group.add_argument("--export-only", action="store_true", help="Bypass Stages 1-3 and regenerate frontend data feeds only")
    
    args = parser.parse_args()
    
    # Define active stages based on CLI choice
    active_keys = []
    if args.all:
        active_keys = ["sync", "features", "stall", "finguard", "duplicate", "vendor", "unified_risk", "export_live", "export_perf", "export_projects"]
    elif args.skip_scrape:
        active_keys = ["features", "stall", "finguard", "duplicate", "vendor", "unified_risk", "export_live", "export_perf", "export_projects"]
    elif args.export_only:
        active_keys = ["export_live", "export_perf", "export_projects"]
        
    logger.info("=" * 70)
    logger.info("    NIRIKSHAK AI: END-TO-END ANALYTICS & SYNC ORCHESTRATOR")
    logger.info("=" * 70)
    logger.info(f"Target Directory: {DATA_DIR}")
    logger.info(f"Mode: {'ALL (Stages 1-4)' if args.all else ('SKIP SCRAPE (Stages 2-4)' if args.skip_scrape else 'EXPORT ONLY (Stage 4)')}")
    logger.info(f"Sequence to run: {', '.join(active_keys)}")
    logger.info("-" * 70)
    
    results = {}
    pipeline_start = time.time()
    
    for key in active_keys:
        stage = STAGES[key]
        logger.info(f"Starting {stage['name']}...")
        stage_start = time.time()
        
        success = execute_subprocess(stage["command"])
        elapsed = time.time() - stage_start
        
        if success:
            logger.info(f"SUCCESS: {stage['name']} completed in {elapsed:.2f} seconds.")
            results[stage["name"]] = f"Success ({elapsed:.2f}s)"
        else:
            logger.error(f"FAILURE: {stage['name']} failed in {elapsed:.2f} seconds.")
            results[stage["name"]] = f"Failed ({elapsed:.2f}s)"
            # Stop pipeline if a critical stage fails
            if key not in ["export_perf", "export_projects"]:
                logger.error("Stopping pipeline execution due to critical stage failure.")
                break
                
    pipeline_elapsed = time.time() - pipeline_start
    
    # Gather statistics
    metrics = collect_metrics()
    
    logger.info("\n" + "=" * 70)
    logger.info("                  PIPELINE RUN SUMMARY")
    logger.info("=" * 70)
    logger.info(f"Total Pipeline Elapsed Time: {pipeline_elapsed:.2f} seconds\n")
    
    logger.info("STAGE RESULTS:")
    for stage_name, status in results.items():
        logger.info(f"  - {stage_name:<50}: {status}")
        
    logger.info("\nMETRICS & ANOMALIES:")
    logger.info(f"  - Total Projects in Feeds : {metrics['total_projects']}")
    logger.info(f"  - High-Risk Projects (>70): {metrics['high_risk_projects']}")
    logger.info(f"  - FinGuard Budget Anomalies: {metrics['finguard_anomalies']}")
    logger.info(f"  - Duplicate Project Alerts : {metrics['duplicate_alerts']}")
    
    logger.info("\nUPDATED DATA MART FEEDS (frontend/public/data/):")
    if os.path.exists(DATA_DIR):
        files = [f for f in os.listdir(DATA_DIR) if f.endswith(('.json', '.geojson'))]
        for f in sorted(files):
            fp = os.path.join(DATA_DIR, f)
            sz = os.path.getsize(fp)
            logger.info(f"  - {f:<35} ({format_size(sz)})")
    else:
        logger.warning("  Data directory not found!")
        
    logger.info("\n" + "-" * 70)
    logger.info("[Ready for Deploy] Run the following git commands to push updates to OCI VM:")
    logger.info("  git add .")
    logger.info("  git commit -m \"data: recomputed analytics and synchronized data feeds\"")
    logger.info("  git push origin main")
    logger.info("=" * 70)

if __name__ == "__main__":
    run_pipeline()
