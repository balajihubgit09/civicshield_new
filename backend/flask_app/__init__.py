from flask import Flask, jsonify

from .config import load_config
from .routes import admin_bp, public_bp
from .services.dataset_service import dataset_service
from .services.system_service import system_service


def create_app():
    app = Flask(__name__)
    app.config.update(load_config())

    with app.app_context():
        dataset_service.load()
        system_service.initialize()

    @app.before_request
    def capture_origin():
        from flask import request

        app.config["REQUEST_ORIGIN"] = request.headers.get("Origin")

    @app.before_request
    def apply_request_context():
        origin = app.config.get("REQUEST_ORIGIN")
        if origin:
            allowed = app.config["ALLOWED_ORIGINS"]
            if origin not in allowed:
                return jsonify(
                    {
                        "error": "CORS_NOT_ALLOWED",
                        "message": "Origin is not allowed to access this resource.",
                    }
                ), 403

    @app.after_request
    def set_default_headers(response):
        origin = app.config.get("REQUEST_ORIGIN")
        if origin and origin in app.config["ALLOWED_ORIGINS"]:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Cross-Origin-Resource-Policy"] = "same-site"
        return response

    @app.route("/api/<path:_path>", methods=["OPTIONS"])
    def options_preflight(_path):
        response = app.response_class(status=204)
        origin = app.config.get("REQUEST_ORIGIN")
        if origin and origin in app.config["ALLOWED_ORIGINS"]:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
            response.headers["Access-Control-Max-Age"] = "86400"
            response.headers["Vary"] = "Origin"
        return response

    @app.teardown_request
    def clear_origin(_error):
        app.config["REQUEST_ORIGIN"] = None

    @app.errorhandler(404)
    def handle_not_found(_error):
        return jsonify({"error": "Route not found"}), 404

    @app.errorhandler(Exception)
    def handle_exception(error):
        from .errors import AppError

        if isinstance(error, AppError):
            payload = {"error": error.code, "message": error.message}
            if error.details is not None:
                payload["details"] = error.details
            return jsonify(payload), error.status_code

        payload = {
            "error": "INTERNAL_SERVER_ERROR",
            "message": str(error) or "Unexpected server error",
        }
        if app.debug:
            payload["stack"] = repr(error)
        return jsonify(payload), 500

    app.register_blueprint(public_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    return app
