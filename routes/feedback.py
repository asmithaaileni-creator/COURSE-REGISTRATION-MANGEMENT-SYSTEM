from flask import Blueprint, request, jsonify, session
from db import get_db
from auth_middleware import require_auth

feedback_bp = Blueprint("feedback", __name__)

@feedback_bp.get("/api/feedback")
@require_auth
def list_feedback():
    course_id = request.args.get("courseId")
    conn = get_db()
    try:
        cur = conn.cursor()
        if session.get("role") == "admin":
            if course_id:
                cur.execute(
                    "SELECT * FROM feedback WHERE course_id = %s ORDER BY created_at DESC",
                    (int(course_id),),
                )
            else:
                cur.execute("SELECT * FROM feedback ORDER BY created_at DESC")
        else:
            if course_id:
                cur.execute(
                    "SELECT * FROM feedback WHERE student_id = %s AND course_id = %s ORDER BY created_at DESC",
                    (session["user_id"], int(course_id)),
                )
            else:
                cur.execute(
                    "SELECT * FROM feedback WHERE student_id = %s ORDER BY created_at DESC",
                    (session["user_id"],),
                )
        rows = cur.fetchall()
        return jsonify([
            {
                "id": f["id"],
                "studentId": f["student_id"],
                "courseId": f["course_id"],
                "rating": f["rating"],
                "comment": f["comment"],
                "createdAt": f["created_at"].isoformat(),
            }
            for f in rows
        ])
    finally:
        conn.close()

@feedback_bp.post("/api/feedback")
@require_auth
def submit_feedback():
    data = request.get_json() or {}
    course_id = data.get("courseId")
    rating = data.get("rating")
    comment = data.get("comment", "")

    if not course_id or not rating:
        return jsonify({"error": "courseId and rating are required"}), 400
    if not isinstance(rating, int) or rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    student_id = session["user_id"]
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id FROM enrollments WHERE student_id = %s AND course_id = %s AND status = 'active'",
            (student_id, course_id),
        )
        if not cur.fetchone():
            return jsonify({"error": "You must be enrolled to leave feedback"}), 400

        cur.execute(
            "SELECT id FROM feedback WHERE student_id = %s AND course_id = %s",
            (student_id, course_id),
        )
        if cur.fetchone():
            return jsonify({"error": "You have already submitted feedback for this course"}), 400

        cur.execute(
            "INSERT INTO feedback (student_id, course_id, rating, comment) VALUES (%s,%s,%s,%s) RETURNING *",
            (student_id, course_id, rating, comment),
        )
        f = cur.fetchone()
        conn.commit()
        return jsonify({
            "id": f["id"],
            "studentId": f["student_id"],
            "courseId": f["course_id"],
            "rating": f["rating"],
            "comment": f["comment"],
            "createdAt": f["created_at"].isoformat(),
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
