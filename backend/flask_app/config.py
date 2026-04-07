import os
from pathlib import Path


def _load_env_file():
    backend_root = Path(__file__).resolve().parent.parent
    env_path = backend_root / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def load_config():
    _load_env_file()
    backend_root = Path(__file__).resolve().parent.parent
    data_dir = backend_root / "data"

    return {
      "PORT": int(os.getenv("PORT", "4000")),
      "SALT": os.getenv("CITIZEN_HASH_SALT", "CIVICSHIELD_2026_HACKATHON_SALT"),
      "ADMIN_USERNAME": os.getenv("ADMIN_USERNAME", "admin"),
      "ADMIN_PASSWORD": os.getenv("ADMIN_PASSWORD", "civicshield123"),
      "INITIAL_BUDGET": int(os.getenv("INITIAL_BUDGET", "1000000")),
      "ALLOWED_ORIGINS": [
          value.strip()
          for value in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
          if value.strip()
      ],
      "CLAIMS_RATE_WINDOW_MS": int(os.getenv("CLAIMS_RATE_WINDOW_MS", "60000")),
      "CLAIMS_RATE_MAX": int(os.getenv("CLAIMS_RATE_MAX", "30")),
      "ADMIN_RATE_WINDOW_MS": int(os.getenv("ADMIN_RATE_WINDOW_MS", "60000")),
      "ADMIN_RATE_MAX": int(os.getenv("ADMIN_RATE_MAX", "60")),
      "DATA_DIR": data_dir,
      "DATASET_PATH": data_dir / "CivicShield_Dataset.xlsx",
      "LEDGER_PATH": data_dir / "ledger.json",
      "STATE_PATH": data_dir / "state.json",
      "REQUEST_ORIGIN": None,
    }
