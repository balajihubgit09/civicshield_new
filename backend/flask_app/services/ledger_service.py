from flask import current_app

from ..utils.file_store import read_json, write_json
from ..utils.hash_utils import build_ledger_hash


class LedgerService:
    def get_entries(self):
        return read_json(current_app.config["LEDGER_PATH"], [])

    def save_entries(self, entries):
        write_json(current_app.config["LEDGER_PATH"], entries)

    def validate_chain(self):
        entries = self.get_entries()

        for index, entry in enumerate(entries):
            expected_previous_hash = "GENESIS" if index == 0 else entries[index - 1]["CurrentHash"]
            expected_current_hash = build_ledger_hash({**entry, "PreviousHash": expected_previous_hash})

            if entry["PreviousHash"] != expected_previous_hash or entry["CurrentHash"] != expected_current_hash:
                return {
                    "valid": False,
                    "index": index,
                    "expectedPreviousHash": expected_previous_hash,
                    "expectedCurrentHash": expected_current_hash,
                    "actualPreviousHash": entry["PreviousHash"],
                    "actualCurrentHash": entry["CurrentHash"],
                }

        return {"valid": True, "index": -1}

    def append_entry(self, entry_without_hashes):
        entries = self.get_entries()
        previous_hash = "GENESIS" if not entries else entries[-1]["CurrentHash"]
        next_entry = {**entry_without_hashes, "PreviousHash": previous_hash}
        next_entry["CurrentHash"] = build_ledger_hash(next_entry)
        entries.append(next_entry)
        self.save_entries(entries)
        return next_entry


ledger_service = LedgerService()
