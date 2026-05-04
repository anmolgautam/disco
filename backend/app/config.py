from pathlib import Path

# Filesystem paths
# Resolved from this file's location so consumers never count directory levels.
# If app/ moves, only this file changes.
BACKEND_ROOT = Path(__file__).resolve().parent.parent
PROMPTS_DIR = BACKEND_ROOT / "prompts"
ARTIFACTS_DIR = BACKEND_ROOT / "artifacts"


# LLM client
# Default provider; overridden by the LLM_PROVIDER env var in llm_caller.py.
LLM_PROVIDER_DEFAULT = "anthropic"
LLM_MODEL_ANTHROPIC = "claude-opus-4-7"
LLM_MODEL_OPENAI = "gpt-5.5"
LLM_MAX_TOKENS = 8000

# Per-call retries on JSON or pydantic validation failure.
MAX_RETRIES = 3



# Concurrency
# Per-stage thread pool size for parallel LLM calls within one stage.
MAX_WORKERS = 10

# Top-level pipeline parallelism. Stages 2 and 3 run concurrently against the same brief.
STAGE_PARALLELISM_WORKERS = 2


# HTTP / API
# slowapi rate-limit string (count / interval). Applied per client IP to /campaign.
RATE_LIMIT = "5/30 seconds"

# Local dev origins. Railway previews are matched by the regex below.
CORS_ALLOW_ORIGINS: list[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]
CORS_ALLOW_ORIGIN_REGEX = r"https://.*\.up\.railway\.app"
