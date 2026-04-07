import base64
import hmac
import time
from functools import wraps

from flask import current_app, jsonify, request


_rate_buckets = {}


def _get_client_key():
    forwarded = request.headers.get("X-Forwarded-For", "").strip()
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


def rate_limit(window_ms, maximum, label):
    def decorator(handler):
        @wraps(handler)
        def wrapped(*args, **kwargs):
            now = int(time.time() * 1000)
            key = f"{label}:{_get_client_key()}"
            current = _rate_buckets.get(key)

            if not current or current["expiresAt"] <= now:
                _rate_buckets[key] = {"count": 1, "expiresAt": now + window_ms}
                return handler(*args, **kwargs)

            current["count"] += 1
            if current["count"] > maximum:
                retry_after = max(1, int((current["expiresAt"] - now + 999) / 1000))
                response = jsonify(
                    {
                        "error": "RATE_LIMITED",
                        "message": "Too many requests. Please retry after the cooldown window.",
                    }
                )
                response.headers["Retry-After"] = str(retry_after)
                return response, 429

            return handler(*args, **kwargs)

        return wrapped

    return decorator


def admin_auth(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Basic "):
            response = jsonify({"error": "Unauthorized"})
            response.headers["WWW-Authenticate"] = 'Basic realm="CivicShield Admin"'
            return response, 401

        encoded = header.replace("Basic ", "", 1)
        try:
            decoded = base64.b64decode(encoded).decode("utf-8")
        except Exception:
            response = jsonify({"error": "Unauthorized"})
            response.headers["WWW-Authenticate"] = 'Basic realm="CivicShield Admin"'
            return response, 401

        username, _, password = decoded.partition(":")
        valid_user = hmac.compare_digest(str(username), str(current_app.config["ADMIN_USERNAME"]))
        valid_password = hmac.compare_digest(str(password), str(current_app.config["ADMIN_PASSWORD"]))

        if not valid_user or not valid_password:
            response = jsonify({"error": "Unauthorized"})
            response.headers["WWW-Authenticate"] = 'Basic realm="CivicShield Admin"'
            return response, 401

        return handler(*args, **kwargs)

    return wrapped
