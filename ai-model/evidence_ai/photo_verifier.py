"""photo_verifier.py

Perceptual hashing, duplicate image detection, and EXIF metadata verification.
Uses difference hash (dHash) via Pillow to flag recycled or suspicious site photos.
"""

import os
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image, ExifTags
from datetime import datetime


def compute_dhash(image_path: str, hash_size: int = 8) -> Optional[str]:
    """Compute difference hash (dHash) for an image."""
    if not os.path.exists(image_path):
        return None
    try:
        with Image.open(image_path) as img:
            # Convert to grayscale and resize to (hash_size + 1, hash_size)
            img_gray = img.convert("L").resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
            pixels = list(img_gray.tobytes())

            # Compare adjacent pixels in each row
            diff = []
            for row in range(hash_size):
                row_start = row * (hash_size + 1)
                for col in range(hash_size):
                    left = pixels[row_start + col]
                    right = pixels[row_start + col + 1]
                    diff.append(left > right)

            # Convert boolean array to hex string
            decimal_value = 0
            hex_str = []
            for index, value in enumerate(diff):
                if value:
                    decimal_value += 2 ** (index % 4)
                if (index % 4) == 3:
                    hex_str.append(hex(decimal_value)[2:])
                    decimal_value = 0
            return "".join(hex_str)
    except Exception:
        return None


def hamming_distance(hash1: str, hash2: str) -> int:
    """Calculate hamming distance between two hex hashes."""
    if len(hash1) != len(hash2):
        return 999
    return sum(bin(int(c1, 16) ^ int(c2, 16)).count("1") for c1, c2 in zip(hash1, hash2))


def extract_exif_metadata(image_path: str) -> Dict[str, Any]:
    """Extract EXIF datetime and GPS tags if present in the image."""
    if not os.path.exists(image_path):
        return {"has_exif": False, "status": "FILE_NOT_FOUND"}

    try:
        with Image.open(image_path) as img:
            exif_data = img._getexif()
            if not exif_data:
                return {"has_exif": False, "status": "NO_EXIF_DATA"}

            extracted = {"has_exif": True}
            for tag_id, value in exif_data.items():
                tag = ExifTags.TAGS.get(tag_id, tag_id)
                if tag == "DateTimeOriginal" or tag == "DateTime":
                    extracted["captured_at"] = str(value)
                elif tag == "GPSInfo":
                    extracted["has_gps"] = True
                    extracted["gps_raw"] = str(value)

            return extracted
    except Exception as e:
        return {"has_exif": False, "status": f"EXIF_ERROR: {str(e)}"}


class PhotoVerifier:
    """Manages site photo validation, duplicate index, and EXIF consistency."""

    def __init__(self):
        # Maps hash -> list of project_ids that uploaded this photo
        self.image_hash_registry: Dict[str, List[str]] = {}

    def register_and_verify(
        self,
        project_id: str,
        image_path: str,
        project_start_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Verifies an uploaded photo against the duplicate database and metadata rules.

        Returns:
            Dict containing similarity metrics, duplicate flags, and exif evaluation.
        """
        if not os.path.exists(image_path):
            return {
                "verified": False,
                "status": "IMAGE_NOT_FOUND",
                "risk_penalty": 0,
                "flags": ["Photo file missing"],
            }

        img_hash = compute_dhash(image_path)
        if not img_hash:
            return {
                "verified": False,
                "status": "UNREADABLE_IMAGE",
                "risk_penalty": 20,
                "flags": ["Image file corrupt or unreadable"],
            }

        flags = []
        risk_penalty = 0
        duplicate_matches = []

        # Check for exact or near duplicate (Hamming distance <= 4)
        for registered_hash, projects in self.image_hash_registry.items():
            dist = hamming_distance(img_hash, registered_hash)
            if dist <= 4:
                other_projects = [p for p in projects if p != project_id]
                if other_projects:
                    duplicate_matches.extend(other_projects)
                    flags.append(
                        f"Duplicate image detected! Matches photo previously submitted for Project(s) {', '.join(other_projects)} (Hamming Dist: {dist})"
                    )
                    risk_penalty += 60

        # Register in hash registry
        if img_hash not in self.image_hash_registry:
            self.image_hash_registry[img_hash] = []
        if project_id not in self.image_hash_registry[img_hash]:
            self.image_hash_registry[img_hash].append(project_id)

        # Check EXIF Metadata
        exif_info = extract_exif_metadata(image_path)
        if not exif_info.get("has_exif"):
            flags.append("Photo lacks EXIF metadata (stripped or screenshot)")
            risk_penalty += 10
        else:
            if "captured_at" in exif_info and project_start_date:
                try:
                    cap_date = datetime.strptime(exif_info["captured_at"][:10], "%Y:%m:%d")
                    if cap_date < project_start_date:
                        flags.append(
                            f"Photo timestamp ({cap_date.strftime('%Y-%m-%d')}) predates project sanction date ({project_start_date.strftime('%Y-%m-%d')})"
                        )
                        risk_penalty += 45
                except Exception:
                    pass

        return {
            "verified": True,
            "hash": img_hash,
            "duplicate_matches": duplicate_matches,
            "exif_metadata": exif_info,
            "flags": flags,
            "risk_penalty": min(100, risk_penalty),
        }
