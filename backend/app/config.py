"""Application configuration loaded from environment variables."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="", extra="ignore")

    # Upstream BILLmanager-style pricelist proxy.
    upstream_url: str = "https://api.zomrodev.online/v1/api/proxy/"

    # Datacenters we request from upstream. The design exposes four switches
    # (Poland, Netherlands, Germany, USA) which map to these BILLmanager ids.
    datacenters: str = "12,17,19,21"

    # fgroup_2 tag that marks a "forex_server" tariff in the upstream payload.
    forex_group_tag: str = "9"

    # Seconds to cache an upstream response in-process (the catalogue changes
    # rarely, so we avoid hammering the upstream proxy on every page load).
    cache_ttl_seconds: int = 120

    upstream_timeout_seconds: float = 15.0

    # Comma-separated list of allowed CORS origins. Defaults to "*" since this
    # is a public, read-only catalogue API (the frontend itself uses the
    # same-origin proxy and doesn't rely on CORS).
    cors_origins: str = "*"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
