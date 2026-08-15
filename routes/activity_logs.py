from flask import Blueprint, request, jsonify, session
from db import get_db
from auth_middleware import require_admin

activity_logs_bp = Blueprint("activity_logs", __name__)

@activity_logs_bp.get("/api/activity-logs")
@require_admin
def list_activity_logs():
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 50))
    offset = (page - 1) * limit
    user_id = request.args.get("userId")

    conn = get_db()
    try:
        cur = conn.cursor()
        if user_id:
            cur.execute(
                """SELECT al.*, u.username, u.first_name, u.last_name
                   FROM activity_logs al
                   LEFT JOIN users u ON u.id = al.user_id
                   WHERE al.user_id = %s
                   ORDER BY al.created_at DESC
                   LIMIT %s OFFSET %s""",
                (int(user_id), limit, offset),
            )
        else:
            cur.execute(
                """SELECT al.*, u.username, u.first_name, u.last_name
                   FROM activity_logs al
                   LEFT JOIN users u ON u.id = al.user_id
                   ORDER BY al.created_at DESC
                   LIMIT %s OFFSET %s""",
                (limit, offset),
            )
        rows = cur.fetchall()

        cur.execute("SELECT CAST(COUNT(*) AS INT) as total FROM activity_logs")
        total = cur.fetchone()["total"]

        logs = []
        for r in rows:
            logs.append({
                "id": r["id"],
                "userId": r["user_id"],
                "action": r["action"],
                "details": r["details"],
                "createdAt": r["created_at"].isoformat(),
                "user": {
                    "username": r["username"],
                    "firstName": r["first_name"],
                    "lastName": r["last_name"],
                } if r["username"] else None,
            })

        return jsonify({"logs": logs, "total": total, "page": page, "limit": limit})
    finally:
        conn.close()
