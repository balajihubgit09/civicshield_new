import hashlib


def sha256(value):
    return hashlib.sha256(str(value).encode("utf-8")).hexdigest()


def build_citizen_hash(citizen_id, salt):
    return sha256(f"{citizen_id}{salt}")


def build_ledger_hash(entry):
    payload = f"{entry['Timestamp']}{entry['CitizenHash']}{entry['Scheme']}{entry['Amount']}{entry['PreviousHash']}"
    return sha256(payload)


def build_replay_signature(citizen_hash, scheme, amount):
    return sha256(f"{citizen_hash}::{scheme}::{amount}")
