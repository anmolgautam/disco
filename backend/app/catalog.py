import json
from pathlib import Path

from app.schemas import Persona, Publisher

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "assignment" / "data"


def load_publishers() -> list[Publisher]:
    with open(DATA_DIR / "publishers.json") as f:
        return [Publisher(**p) for p in json.load(f)]


def load_personas() -> list[Persona]:
    with open(DATA_DIR / "shopper_personas.json") as f:
        return [Persona(**p) for p in json.load(f)]
