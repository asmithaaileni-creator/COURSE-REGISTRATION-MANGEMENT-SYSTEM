from flask import Blueprint, request, session, jsonify
import bcrypt
from db import get_db

auth_bp = Blueprint("auth", __name__)

def fmt_user(u):
    return {
        "id": u["id"],
        "username": u["username"],
        "email": u["email"],
        "firstName": u["first_name"],
        "lastName": u["last_name"],
        "role": u["role"],
        "createdAt": u["created_at"].isoformat(),
    }

@auth_bp.post("/api/auth/register")
def register():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    first_name = data.get("firstName", "").strip()
    last_name = data.get("lastName", "").strip()

    if not username or not email or not password or not first_name or not last_name:
        return jsonify({"error": "All fields are required"}), 400

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            return jsonify({"error": "Username already taken"}), 400
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({"error": "Email already registered"}), 400

        pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        cur.execute(
            "INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES (%s,%s,%s,%s,%s,'student') RETURNING *",
            (username, email, pw_hash, first_name, last_name),
        )
        user = cur.fetchone()
        cur.execute(
            "INSERT INTO activity_logs (user_id, action, details) VALUES (%s,'REGISTER',%s)",
            (user["id"], f"New student registered: {username}"),
        )
        conn.commit()

        session["user_id"] = user["id"]
        session["role"] = user["role"]
        return jsonify(fmt_user(user)), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@auth_bp.post("/api/auth/login")
def login():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        if not user:
            return jsonify({"error": "Invalid username or password"}), 401

        if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
            return jsonify({"error": "Invalid username or password"}), 401

        cur.execute(
            "INSERT INTO activity_logs (user_id, action, details) VALUES (%s,'LOGIN',%s)",
            (user["id"], f"User logged in: {username}"),
        )
        conn.commit()

        session["user_id"] = user["id"]
        session["role"] = user["role"]
        return jsonify(fmt_user(user))
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@auth_bp.post("/api/auth/logout")
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out"})

@auth_bp.get("/api/auth/me")
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 401
        return jsonify(fmt_user(user))
    finally:
        conn.close()
