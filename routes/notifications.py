from flask import Blueprint, jsonify, session
from db import get_db
from auth_middleware import require_auth

notifications_bp = Blueprint("notifications", __name__)

@notifications_bp.get("/api/notifications")
@require_auth
def list_notifications():
    student_id = session["user_id"]
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM notifications WHERE student_id = %s ORDER BY created_at DESC",
            (student_id,),
        )
        rows = cur.fetchall()
        return jsonify([
            {
                "id": n["id"],
                "studentId": n["student_id"],
                "message": n["message"],
                "type": n["type"],
                "isRead": n["is_read"],
                "createdAt": n["created_at"].isoformat(),
            }
            for n in rows
        ])
    finally:
        conn.close()

@notifications_bp.patch("/api/notifications/<int:notif_id>/read")
@require_auth
def mark_read(notif_id):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE notifications SET is_read = TRUE WHERE id = %s AND student_id = %s RETURNING *",
            (notif_id, session["user_id"]),
        )
        n = cur.fetchone()
        if not n:
            return jsonify({"error": "Notification not found"}), 404
        conn.commit()
        return jsonify({
            "id": n["id"],
            "studentId": n["student_id"],
            "message": n["message"],
            "type": n["type"],
            "isRead": n["is_read"],
            "createdAt": n["created_at"].isoformat(),
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
