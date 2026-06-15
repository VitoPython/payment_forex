"""FastAPI application exposing the normalised Forex catalogue to the frontend."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .normalize import build_catalogue
from .schemas import ForexCatalogue
from .zomro import UpstreamError, ZomroClient

settings = get_settings()
# Buy link carrying each plan's unique id. The concrete URL is irrelevant for
# this task — only the embedded unique key matters.
ORDER_URL_TEMPLATE = "/order?plan={key}"


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.zomro = ZomroClient(settings)
    yield


app = FastAPI(
    title="Cloud Forex Servers API",
    version="1.0.0",
    summary="Normalised Forex VPS pricelist proxied from the upstream provider.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/forex/catalogue", response_model=ForexCatalogue, tags=["forex"])
async def get_catalogue() -> ForexCatalogue:
    """Return all Forex plans grouped with their datacenters and billing periods.

    The frontend fetches this once and performs datacenter/period switching
    client-side for an instant, network-free interaction.
    """
    try:
        payload = await app.state.zomro.fetch_pricelist()
    except UpstreamError as exc:
        raise HTTPException(status_code=502, detail=f"Upstream unavailable: {exc}")

    return build_catalogue(
        payload,
        forex_tag=settings.forex_group_tag,
        order_url_template=ORDER_URL_TEMPLATE,
    )
