import json


def ensure_json_file(file_path, default_value):
    if not file_path.exists():
        file_path.write_text(json.dumps(default_value, indent=2), encoding="utf-8")


def read_json(file_path, default_value):
    ensure_json_file(file_path, default_value)
    return json.loads(file_path.read_text(encoding="utf-8"))


def write_json(file_path, value):
    file_path.write_text(json.dumps(value, indent=2), encoding="utf-8")
