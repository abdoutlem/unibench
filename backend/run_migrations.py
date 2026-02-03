#!/usr/bin/env python3
"""Run database migrations."""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.db.migrations import run_migrations

if __name__ == "__main__":
    print("Running database migrations...")
    run_migrations()
    print("Migrations completed!")
