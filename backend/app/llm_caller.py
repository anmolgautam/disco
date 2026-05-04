import os

from anthropic import Anthropic
from dotenv import load_dotenv
from openai import OpenAI

from app.config import (
    LLM_MAX_TOKENS,
    LLM_MODEL_ANTHROPIC,
    LLM_MODEL_OPENAI,
    LLM_PROVIDER_DEFAULT,
)

load_dotenv()

ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
PROVIDER_PREF = os.getenv("LLM_PROVIDER", LLM_PROVIDER_DEFAULT).lower()

# Resolve provider: honor the requested preference if its key is present.
# Otherwise fall back to whichever provider has a key available.
if PROVIDER_PREF == "anthropic" and ANTHROPIC_KEY:
    PROVIDER = "anthropic"
elif PROVIDER_PREF == "openai" and OPENAI_KEY:
    PROVIDER = "openai"
elif OPENAI_KEY:
    PROVIDER = "openai"
elif ANTHROPIC_KEY:
    PROVIDER = "anthropic"
else:
    raise RuntimeError(
        "No LLM provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env."
    )

if PROVIDER == "anthropic":
    _client = Anthropic(api_key=ANTHROPIC_KEY)
    MODEL = LLM_MODEL_ANTHROPIC
else:
    _client = OpenAI(api_key=OPENAI_KEY)
    MODEL = LLM_MODEL_OPENAI


def call_llm(system_prompt: str, user_input: str, model: str | None = None) -> str:
    """Send a prompt and return the raw text response. Caller parses JSON."""
    model = model or MODEL
    if PROVIDER == "anthropic":
        r = _client.messages.create(
            model=model,
            max_tokens=LLM_MAX_TOKENS,
            system=system_prompt,
            messages=[{"role": "user", "content": user_input}],
        )
        return r.content[0].text
    else:
        r = _client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input},
            ],
        )
        return r.choices[0].message.content
