import subprocess
import os

commit_hash = "577b581e78c7661cff2da9e2f22f5ed79a6ff16b"
files_to_restore = [
    "ai-model/evidence_ai/__init__.py",
    "ai-model/evidence_ai/doc_verifier.py",
    "ai-model/evidence_ai/interface.py",
    "ai-model/evidence_ai/photo_verifier.py",
    "ai-model/evidence_ai/tests/__init__.py",
    "ai-model/evidence_ai/tests/test_evidence_ai.py",
    "ai-model/investigation_hub/__init__.py",
    "ai-model/investigation_hub/case_manager.py",
    "ai-model/investigation_hub/models.py",
    "ai-model/investigation_hub/tests/__init__.py",
    "ai-model/investigation_hub/tests/test_investigation_hub.py",
    "ai-model/investigation_hub/workflow.py"
]

for f in files_to_restore:
    dest_path = f.replace("/", os.sep)
    dest_dir = os.path.dirname(dest_path)
    if dest_dir:
        os.makedirs(dest_dir, exist_ok=True)
    
    print(f"Restoring {f}...")
    try:
        content = subprocess.check_output(["git", "show", f"{commit_hash}:{f}"])
        with open(dest_path, "wb") as out_f:
            out_f.write(content)
        print(f"Successfully restored to {dest_path}")
    except Exception as e:
        print(f"Failed to restore {f}: {e}")
