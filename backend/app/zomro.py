"""Thin client around the upstream BILLmanager pricelist proxy.

Adds a tiny in-process TTL cache so repeated frontend loads don't re-hit the
upstream service for what is effectively a static catalogue.
"""
import asyncio
import time
from typing import Any

import httpx

from .config import Settings

# Transient upstream statuses worth retrying (the provider intermittently
# answers 503/502/429 under load before serving the real payload).
_RETRYABLE_STATUSES = {429, 502, 503, 504}
_MAX_ATTEMPTS = 4
_BACKOFF_BASE_SECONDS = 0.5


class UpstreamError(RuntimeError):
    """Raised when the upstream proxy is unreachable or returns an error."""


class EmptyPayloadError(RuntimeError):
    """A 200 response that carries no instances — treated as transient.

    Under load the upstream occasionally answers 200 with an empty pricelist;
    caching that would wipe the catalogue, so we retry instead.
    """


def _count_instances(payload: dict[str, Any]) -> int:
    blocks = payload.get("doc", {}).get("list", [])
    if isinstance(blocks, dict):
        blocks = [blocks]
    total = 0
    for block in blocks or []:
        elem = block.get("elem", [])
        total += len(elem) if isinstance(elem, list) else (1 if elem else 0)
    return total


class ZomroClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._cache: dict[str, Any] | None = None
        self._cache_expiry: float = 0.0

    async def fetch_pricelist(self, *, force: bool = False) -> dict[str, Any]:
        now = time.monotonic()
        if not force and self._cache is not None and now < self._cache_expiry:
            return self._cache

        form = {
            "func": "v2.instances.order.pricelist",
            "out": "json",
            "lang": "en",
            "page": "1",
            "page_size": "999",
            "datacenter": self._settings.datacenters,
        }

        try:
            payload = await self._post_with_retry(form)
        except (httpx.HTTPError, ValueError, EmptyPayloadError) as exc:
            # Serve stale cache if we have it; otherwise surface the failure.
            if self._cache is not None:
                return self._cache
            raise UpstreamError(str(exc)) from exc

        # Only cache responses that actually contain instances.
        self._cache = payload
        self._cache_expiry = now + self._settings.cache_ttl_seconds
        return payload

    async def _post_with_retry(self, form: dict[str, str]) -> dict[str, Any]:
        """POST to upstream, retrying transient 5xx/429/empty with backoff."""
        last_exc: Exception | None = None
        async with httpx.AsyncClient(
            timeout=self._settings.upstream_timeout_seconds
        ) as client:
            for attempt in range(1, _MAX_ATTEMPTS + 1):
                try:
                    response = await client.post(self._settings.upstream_url, data=form)
                    response.raise_for_status()
                    payload = response.json()
                    if _count_instances(payload) == 0:
                        raise EmptyPayloadError("upstream returned an empty pricelist")
                    return payload
                except (httpx.HTTPError, ValueError, EmptyPayloadError) as exc:
                    last_exc = exc
                    status = getattr(getattr(exc, "response", None), "status_code", None)
                    # Retry transient failures (network, 5xx/429, empty body);
                    # fail fast on genuine 4xx.
                    transient = (
                        isinstance(exc, (httpx.TransportError, httpx.TimeoutException, EmptyPayloadError))
                        or status in _RETRYABLE_STATUSES
                    )
                    if not transient or attempt == _MAX_ATTEMPTS:
                        raise
                    await asyncio.sleep(_BACKOFF_BASE_SECONDS * attempt)
        # Unreachable, but keeps type-checkers happy.
        raise last_exc if last_exc else RuntimeError("upstream request failed")
