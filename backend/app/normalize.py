"""Transform the raw BILLmanager pricelist payload into the clean public schema.

Upstream quirks handled here:
- every scalar is wrapped as ``{"$": value}``;
- a node may be a single object or a list of objects depending on cardinality;
- forex tariffs are flagged by ``fgroup_2.tag.$ == FOREX_GROUP_TAG``;
- a tariff title looks like ``"Cloud Forex 1| NL-3"`` (name + short DC code);
- prices are listed per billing period under ``prices.price``.
"""
import re
from typing import Any

from .schemas import Datacenter, ForexCatalogue, Period, Plan, PlanSpecs

# Periods we surface in the UI (month-based plans only — we drop the upstream
# "day" (-50) and "any" (null) entries which the design's selector doesn't use).
ALLOWED_PERIODS = {"1", "3", "6", "12"}

_TITLE_RE = re.compile(r"^(?P<name>.+?)\s*(?:\|\s*(?P<short>.+))?$")
_TIER_RE = re.compile(r"(\d+)")


def _val(node: Any) -> Any:
    """Unwrap a ``{"$": value}`` scalar; pass through plain values."""
    if isinstance(node, dict):
        return node.get("$")
    return node


def _as_list(node: Any) -> list[Any]:
    """Normalise BILLmanager's "object-or-list" nodes to a list."""
    if node is None:
        return []
    return node if isinstance(node, list) else [node]


def _split_title(raw_title: str) -> tuple[str, str | None]:
    """``"Cloud Forex 1| NL-3"`` -> (``"Cloud Forex 1"``, ``"NL-3"``)."""
    match = _TITLE_RE.match(raw_title.strip())
    if not match:
        return raw_title.strip(), None
    short = match.group("short")
    return match.group("name").strip(), short.strip() if short else None


def _parse_tier(name: str) -> int:
    match = _TIER_RE.search(name)
    return int(match.group(1)) if match else 0


def _build_specs(detail: list[dict[str, Any]]) -> PlanSpecs:
    """Map the upstream ``detail`` rows (name/value pairs) onto PlanSpecs."""
    by_name = {_val(row.get("name")): _val(row.get("value")) for row in detail}
    return PlanSpecs(
        cpu=by_name.get("CPU count"),
        ram=by_name.get("Memory"),
        disk=by_name.get("Disk space"),
        port=by_name.get("Port speed"),
        traffic=by_name.get("Traffic volume"),
        bandwidth=by_name.get("Bandwidth"),
    )


def _build_prices(prices_node: dict[str, Any]) -> tuple[dict[str, float], str]:
    prices: dict[str, float] = {}
    currency = "EUR"
    for price in _as_list(prices_node.get("price")):
        period = _val(price.get("period"))
        if period not in ALLOWED_PERIODS:
            continue
        cost = _val(price.get("cost"))
        try:
            prices[period] = float(cost)
        except (TypeError, ValueError):
            continue
        currency = _val(price.get("currency")) or currency
    return prices, currency


def _is_forex(elem: dict[str, Any], forex_tag: str) -> bool:
    return _val(elem.get("fgroup_2", {}).get("tag")) == forex_tag


def _periods_from_slist(slist: list[dict[str, Any]]) -> list[Period]:
    for entry in slist:
        if _val_name(entry) != "fperiod":
            continue
        periods: list[Period] = []
        for option in _as_list(entry.get("val")):
            key = option.get("$key")
            if key in ALLOWED_PERIODS:
                periods.append(Period(key=key, months=int(key)))
        return sorted(periods, key=lambda p: p.months)
    # Fallback to a sane default if upstream omitted the selector.
    return [Period(key=k, months=int(k)) for k in sorted(ALLOWED_PERIODS, key=int)]


def _datacenters_from_slist(
    slist: list[dict[str, Any]], shorts: dict[str, str]
) -> list[Datacenter]:
    for entry in slist:
        if _val_name(entry) != "datacenter":
            continue
        dcs: list[Datacenter] = []
        for option in _as_list(entry.get("val")):
            dc_id = option.get("$key")
            dcs.append(
                Datacenter(
                    id=dc_id,
                    name=option.get("$", ""),
                    short=shorts.get(dc_id, ""),
                )
            )
        return dcs
    return []


def _val_name(entry: dict[str, Any]) -> str | None:
    return entry.get("$name")


def build_catalogue(
    payload: dict[str, Any], forex_tag: str, order_url_template: str
) -> ForexCatalogue:
    """Entry point: raw upstream payload -> :class:`ForexCatalogue`."""
    doc = payload.get("doc", {})
    elems: list[dict[str, Any]] = []
    for block in _as_list(doc.get("list")):
        elems.extend(_as_list(block.get("elem")))

    plans: list[Plan] = []
    dc_shorts: dict[str, str] = {}

    for elem in elems:
        if not _is_forex(elem, forex_tag):
            continue

        raw_title = _val(elem.get("title")) or ""
        name, short = _split_title(raw_title)
        datacenter_id = _val(elem.get("datacenter", {}).get("id")) or ""
        if short and datacenter_id:
            dc_shorts.setdefault(datacenter_id, short)

        key = _val(elem.get("keyvalue")) or _val(elem.get("id")) or ""
        prices, currency = _build_prices(elem.get("prices", {}))

        plans.append(
            Plan(
                id=_val(elem.get("id")) or "",
                key=key,
                tier=_parse_tier(name),
                name=name,
                datacenter_id=datacenter_id,
                specs=_build_specs(_as_list(elem.get("detail"))),
                currency=currency,
                prices=prices,
                order_url=order_url_template.format(key=key),
            )
        )

    plans.sort(key=lambda p: (p.datacenter_id, p.tier))

    slist = _as_list(doc.get("slist"))
    return ForexCatalogue(
        datacenters=_datacenters_from_slist(slist, dc_shorts),
        periods=_periods_from_slist(slist),
        plans=plans,
    )
