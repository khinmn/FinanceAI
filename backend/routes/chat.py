"""
Chat Routes  –  /api/chat
===========================
GET    /api/chat/sessions          – list past sessions (most recent 10)
POST   /api/chat/session           – create a new session
GET    /api/chat/sessions/<id>     – get session with full message history
POST   /api/chat/message           – send message → AI response
DELETE /api/chat/sessions/<id>     – delete a session
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from models import db
from models.chat_session import ChatSession, ChatMessage
from services.ai_service import get_chat_response
from services.gap_analysis_service import run_gap_analysis, build_financial_summary
from utils.auth_helpers import get_current_user

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")


# ── Helper: build financial context for chatbot ────────────────────────────────

def _get_financial_context(user_id: int) -> str:
    try:
        analysis = run_gap_analysis(user_id, months_back=2)
        return build_financial_summary(analysis["monthly_data"], analysis["findings"])
    except Exception:
        return "Financial context not available."


# ── List sessions ──────────────────────────────────────────────────────────────

@chat_bp.route("/sessions", methods=["GET"])
@jwt_required()
def get_sessions():
    user = get_current_user()
    sessions = (
        ChatSession.query.filter_by(user_id=user.id)
        .order_by(ChatSession.updated_at.desc())
        .limit(10)
        .all()
    )
    return jsonify({"sessions": [s.to_dict() for s in sessions]}), 200


# ── Create session ─────────────────────────────────────────────────────────────

@chat_bp.route("/session", methods=["POST"])
@jwt_required()
def create_session():
    user = get_current_user()
    data = request.get_json() or {}
    session = ChatSession(
        user_id=user.id,
        title=data.get("title", "Finance Chat"),
    )
    db.session.add(session)
    db.session.commit()
    return jsonify({"session": session.to_dict()}), 201


# ── Get session with messages ──────────────────────────────────────────────────

@chat_bp.route("/sessions/<int:session_id>", methods=["GET"])
@jwt_required()
def get_session(session_id):
    user = get_current_user()
    session = ChatSession.query.filter_by(id=session_id, user_id=user.id).first()
    if not session:
        return jsonify({"error": "Session not found."}), 404
    return jsonify({"session": session.to_dict(include_messages=True)}), 200


# ── Send message ───────────────────────────────────────────────────────────────

@chat_bp.route("/message", methods=["POST"])
@jwt_required()
def send_message():
    user = get_current_user()
    data = request.get_json() or {}

    message_text = (data.get("message") or "").strip()
    if not message_text:
        return jsonify({"error": "message is required."}), 400

    session_id = data.get("session_id")

    # Get or auto-create session
    if session_id:
        session = ChatSession.query.filter_by(id=session_id, user_id=user.id).first()
        if not session:
            return jsonify({"error": "Session not found."}), 404
    else:
        title = message_text[:60] + ("…" if len(message_text) > 60 else "")
        session = ChatSession(user_id=user.id, title=title)
        db.session.add(session)
        db.session.flush()

    # Persist user message
    user_msg = ChatMessage(session_id=session.id, role="user", content=message_text)
    db.session.add(user_msg)

    # Build conversation history for API (last 10 messages)
    existing = [
        {"role": m.role, "content": m.content} for m in session.messages
    ]
    existing.append({"role": "user", "content": message_text})

    # AI response
    financial_ctx = _get_financial_context(user.id)
    ai_text, error = get_chat_response(existing, financial_context=financial_ctx)

    if error:
        ai_text = (
            "I'm having trouble connecting to the AI service right now. "
            f"Please try again in a moment.\n\n_{error}_"
        )

    # Persist assistant message
    assistant_msg = ChatMessage(
        session_id=session.id, role="assistant", content=ai_text
    )
    db.session.add(assistant_msg)

    session.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(
        {
            "session_id": session.id,
            "user_message": user_msg.to_dict(),
            "assistant_message": assistant_msg.to_dict(),
        }
    ), 200


# ── Delete session ─────────────────────────────────────────────────────────────

@chat_bp.route("/sessions/<int:session_id>", methods=["DELETE"])
@jwt_required()
def delete_session(session_id):
    user = get_current_user()
    session = ChatSession.query.filter_by(id=session_id, user_id=user.id).first()
    if not session:
        return jsonify({"error": "Session not found."}), 404
    db.session.delete(session)
    db.session.commit()
    return jsonify({"message": "Session deleted."}), 200
