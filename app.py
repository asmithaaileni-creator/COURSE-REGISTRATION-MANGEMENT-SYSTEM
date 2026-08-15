import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify, request, make_response

from routes.auth import auth_bp
from routes.courses import courses_bp
from routes.enrollments import enrollments_bp
from routes.waitlist import waitlist_bp
from routes.notifications import notifications_bp
from routes.feedback import feedback_bp
from routes.students import students_bp
from routes.dashboard import dashboard_bp
from routes.activity_logs import activity_logs_bp
from routes.export import export_bp

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "course-reg-dev-secret-key-change-me")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False

@app.after_request
def add_cors(response):
    origin = request.headers.get("Origin", "*")
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    return response

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        origin = request.headers.get("Origin", "*")
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        response.status_code = 204
        return response

app.register_blueprint(auth_bp)
app.register_blueprint(courses_bp)
app.register_blueprint(enrollments_bp)
app.register_blueprint(waitlist_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(feedback_bp)
app.register_blueprint(students_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(activity_logs_bp)
app.register_blueprint(export_bp)

@app.get("/api/healthz")
def healthz():
    return jsonify({"status": "ok"})

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"Starting Flask API on port {port}", flush=True)
    app.run(host="0.0.0.0", port=port, debug=False)
