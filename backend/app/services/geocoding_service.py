import httpx
from functools import lru_cache
from app.config import get_settings

settings = get_settings()

# Simple in-memory cache for reverse geocoding results
_geocode_cache: dict[str, dict] = {}


async def reverse_geocode(lat: float, lng: float) -> dict:
    """Reverse-geocode a lat/lng coordinate using Nominatim (OSM).

    Returns dict with 'address' string and optional ward/district info.
    Results are cached by rounded lat/lng to reduce API calls.
    """
    # Round to 4 decimal places (~11m precision) for cache key
    cache_key = f"{round(lat, 4)},{round(lng, 4)}"

    if cache_key in _geocode_cache:
        return _geocode_cache[cache_key]

    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "format": "json",
                    "lat": lat,
                    "lon": lng,
                    "zoom": 16,
                    "addressdetails": 1,
                },
                headers={
                    "User-Agent": settings.NOMINATIM_USER_AGENT,
                },
            )
            if response.status_code == 200:
                data = response.json()
                result = {
                    "address": data.get("display_name", ""),
                    "suburb": data.get("address", {}).get("suburb", ""),
                    "city": data.get("address", {}).get("city", ""),
                    "state": data.get("address", {}).get("state", ""),
                    "postcode": data.get("address", {}).get("postcode", ""),
                }
                _geocode_cache[cache_key] = result
                return result
    except Exception:
        # Fail gracefully & immediately — geocoding is best-effort
        pass

    return {"address": "", "suburb": "", "city": "", "state": "", "postcode": ""}
