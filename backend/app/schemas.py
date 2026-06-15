"""Public response schemas returned to the frontend.

The upstream BILLmanager payload is deeply nested and noisy (every scalar is
wrapped in a ``{"$": value}`` object). These models describe the clean,
flat contract the frontend actually consumes.
"""
from pydantic import BaseModel


class Datacenter(BaseModel):
    id: str           # BILLmanager datacenter id, e.g. "17"
    name: str         # Full name, e.g. "Netherlands-3 [Cloud]"
    short: str        # Short code parsed from the tariff title, e.g. "NL-3"


class Period(BaseModel):
    key: str          # Upstream period key, e.g. "1", "3", "6", "12"
    months: int       # Numeric month count used for labelling/sorting


class PlanSpecs(BaseModel):
    cpu: str | None = None         # vCPU count
    ram: str | None = None         # Memory, e.g. "2.5 Gb"
    disk: str | None = None        # Disk space, e.g. "17 Gb"
    port: str | None = None        # Port speed, e.g. "1000 Mbps"
    traffic: str | None = None     # Traffic volume, e.g. "1 TB"
    bandwidth: str | None = None   # Bandwidth description


class Plan(BaseModel):
    id: str                        # Pricelist id, e.g. "7991"
    key: str                       # Unique order key (keyvalue), e.g. "7991_17"
    tier: int                      # 1..4, parsed from "Cloud Forex N"
    name: str                      # Clean name, e.g. "Cloud Forex 1"
    datacenter_id: str             # Owning datacenter id
    specs: PlanSpecs
    currency: str                  # ISO currency, e.g. "EUR"
    prices: dict[str, float]       # period key -> cost, e.g. {"1": 6.48, ...}
    order_url: str                 # Buy link carrying the plan's unique id


class ForexCatalogue(BaseModel):
    datacenters: list[Datacenter]
    periods: list[Period]
    plans: list[Plan]
