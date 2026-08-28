import os
import json
import time
import logging
import pandas as pd
from typing import Dict, Any, Tuple
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

log = logging.getLogger("geointel")

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
CACHE_FILE = os.path.join(DATA_DIR, "geocache.json")

def load_cache() -> Dict[str, Tuple[float, float]]:
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_cache(cache: Dict[str, Tuple[float, float]]):
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f, indent=2)

def geocode_location(location_name: str, cache: Dict[str, Tuple[float, float]], geolocator) -> Tuple[float, float]:
    if location_name in cache:
        return cache[location_name]
    
    try:
        location = geolocator.geocode(location_name, timeout=10)
        time.sleep(1.1)  # Respect rate limit
        if location:
            cache[location_name] = (location.latitude, location.longitude)
            log.info(f"Geocoded: {location_name} -> {location.latitude}, {location.longitude}")
            return (location.latitude, location.longitude)
        else:
            log.warning(f"Could not geocode: {location_name}")
            cache[location_name] = (None, None)
            return (None, None)
    except (GeocoderTimedOut, GeocoderUnavailable) as e:
        log.error(f"Geocoding error for {location_name}: {e}")
        time.sleep(5)
        return (None, None)

def generate_geointel_geojson(df_hydrated: pd.DataFrame) -> Dict[str, Any]:
    """
    Groups the hydrated master df by constituency, geocodes them, clusters them,
    and returns a standard GeoJSON FeatureCollection.
    """
    geolocator = Nominatim(user_agent="nirikshak_geointel_mapper")
    cache = load_cache()
    
    # 1. Aggregate risk metrics at constituency level
    df = df_hydrated.copy()
    df['sanction_amount'] = pd.to_numeric(df['sanction_amount'], errors='coerce').fillna(0)
    df['cost_z_score'] = pd.to_numeric(df['cost_z_score'], errors='coerce')
    df['completion_delay_days'] = pd.to_numeric(df['completion_delay_days'], errors='coerce')
    
    df['is_high_risk'] = (df['cost_z_score'].abs() > 2) | (df['completion_delay_days'] > 365)
    
    grouped = df.groupby(['constituency_id', 'const_name', 'state_name']).agg(
        total_projects=('work_id', 'count'),
        high_risk_projects=('is_high_risk', 'sum'),
        total_sanctioned=('sanction_amount', 'sum')
    ).reset_index()
    
    grouped['spatial_risk_score'] = (grouped['high_risk_projects'] / grouped['total_projects'].clip(lower=1)).round(4)
    
    # 2. Geocode
    latitudes = []
    longitudes = []
    for _, row in grouped.iterrows():
        # Handle NA or missing names
        if pd.isna(row['const_name']) or pd.isna(row['state_name']):
            latitudes.append(None)
            longitudes.append(None)
            continue
            
        loc_string = f"{row['const_name']}, {row['state_name']}, India"
        lat, lon = geocode_location(loc_string, cache, geolocator)
        latitudes.append(lat)
        longitudes.append(lon)
        
    save_cache(cache)
    
    grouped['lat'] = latitudes
    grouped['lon'] = longitudes
    
    # Filter out un-geocoded
    valid_geo = grouped.dropna(subset=['lat', 'lon']).copy()
    
    if len(valid_geo) == 0:
        log.warning("No valid geocoded locations found.")
        return {"type": "FeatureCollection", "features": []}
        
    # 3. Clustering (K-Means) to find regional risk clusters
    # Features: scaled Lat, Lon, and spatial_risk_score
    features = valid_geo[['lat', 'lon', 'spatial_risk_score']].values
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)
    
    n_clusters = min(10, len(valid_geo))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    valid_geo['cluster_id'] = kmeans.fit_predict(features_scaled)
    
    # 4. Generate GeoJSON
    features_list = []
    for _, row in valid_geo.iterrows():
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [row['lon'], row['lat']]  # GeoJSON format is [lon, lat]
            },
            "properties": {
                "constituency_id": int(row['constituency_id']),
                "const_name": str(row['const_name']),
                "state_name": str(row['state_name']),
                "total_projects": int(row['total_projects']),
                "high_risk_projects": int(row['high_risk_projects']),
                "total_sanctioned": float(row['total_sanctioned']),
                "spatial_risk_score": float(row['spatial_risk_score']),
                "cluster_id": int(row['cluster_id'])
            }
        }
        features_list.append(feature)
        
    geojson = {
        "type": "FeatureCollection",
        "features": features_list
    }
    
    return geojson
