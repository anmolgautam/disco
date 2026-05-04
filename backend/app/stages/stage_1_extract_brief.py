import json
import logging

from pydantic import ValidationError

from app.config import MAX_RETRIES, PROMPTS_DIR
from app.llm_caller import call_llm
from app.schemas import BriefExtractionResponse

logger = logging.getLogger("compose.stage_1")

SYSTEM_PROMPT = (PROMPTS_DIR / "stage_1_extract_brief.txt").read_text()


def extract_brief(oneliner: str) -> BriefExtractionResponse:
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        response = call_llm(SYSTEM_PROMPT, oneliner)
        try:
            data = json.loads(response)
            return BriefExtractionResponse(**data)
        except (json.JSONDecodeError, ValidationError) as e:
            last_error = e
            logger.warning("attempt %d/%d failed: %s: %s", attempt, MAX_RETRIES, type(e).__name__, e)
    raise RuntimeError(f"extract_brief failed after {MAX_RETRIES} attempts: {last_error}")
