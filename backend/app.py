"""
FinanceAI – Flask Application Entry Point
==========================================
Refactored into an app-factory pattern (create_app) for cleaner structure
and easier testing.

Run:
    python app.py           # development
    flask run               # via Flask CLI
"""

import os
from datetime import timedelta
from urllib.parse import quote_plus

import psycopg2
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

load_dotenv()


# ── Ensure the target database exists ──────────────────────────────────────────

def _create_database_if_not_exists() -> None:
    """Connect to the default 'postgres' database and create 'fia' if missing."""
    host = os.getenv("DB_HOST", "localhost")
    port = int(os.getenv("DB_PORT", 5432))
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "")
    db_name = os.getenv("DB_NAME", "fia")

    try:
        conn = psycopg2.connect(
            host=host, port=port, user=user, password=password, dbname="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute(
            "SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (db_name,)
        )
        if not cur.fetchone():
            cur.execute(f'CREATE DATABASE "{db_name}"')
            print(f"[OK] Database '{db_name}' created.")
        else:
            print(f"[OK] Database '{db_name}' already exists.")
        cur.close()
        conn.close()
    except Exception as exc:
        err = str(exc)
        if "no password supplied" in err.lower():
            raise RuntimeError(
                "PostgreSQL connection failed: DB_PASSWORD is missing or incorrect. "
                "Create backend/.env from .env.example and set DB_PASSWORD."
            ) from exc
        print(f"[ERROR] Database setup error: {exc}")
        raise


# ── App factory ────────────────────────────────────────────────────────────────

def create_app() -> Flask:
    _create_database_if_not_exists()

    app = Flask(__name__)

    # ── SQLAlchemy ────────────────────────────────────────────────────────────
    _user = os.getenv("DB_USER", "postgres")
    _pw = quote_plus(os.getenv("DB_PASSWORD", ""))  # encode @, $, # etc.
    _host = os.getenv("DB_HOST", "localhost")
    _port = os.getenv("DB_PORT", "5432")
    _name = os.getenv("DB_NAME", "fia")

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"postgresql://{_user}:{_pw}@{_host}:{_port}/{_name}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # ── JWT ───────────────────────────────────────────────────────────────────
    app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET_KEY", "change-this-secret-in-production"
    )
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)

    # ── OpenRouter AI ─────────────────────────────────────────────────────────
    app.config["OPENROUTER_API_KEY"] = os.getenv("OPENROUTER_API_KEY", "")
    app.config["OPENROUTER_MODEL"] = os.getenv(
        "OPENROUTER_MODEL", "google/gemini-2.5-flash"
    )

    # ── Extensions ────────────────────────────────────────────────────────────
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)

    from models import db
    db.init_app(app)

    # ── Blueprints ────────────────────────────────────────────────────────────
    from routes.auth import auth_bp
    from routes.transactions import transactions_bp
    from routes.categories import categories_bp
    from routes.dashboard import dashboard_bp
    from routes.gap_analysis import gap_bp
    from routes.chat import chat_bp
    from routes.reports import reports_bp
    from routes.upload import upload_bp
    from routes.budgets import budgets_bp
    from routes.goals import goals_bp
    from routes.team import team_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(gap_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(budgets_bp)
    app.register_blueprint(goals_bp)
    app.register_blueprint(team_bp)

    # Ensure uploads folder exists
    uploads_dir = os.path.join(app.root_path, "uploads", "receipts")
    os.makedirs(uploads_dir, exist_ok=True)

    # ── Auto-create / verify all tables ──────────────────────────────────────
    with app.app_context():
        db.create_all()
        print("[OK] Database tables created / verified.")

    # ── Built-in routes ───────────────────────────────────────────────────────
    @app.route("/")
    def index():
        return jsonify({"message": "FinanceAI API is running", "version": "2.0"})

    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        from flask import send_from_directory
        return send_from_directory(uploads_dir, filename)

    @app.route("/api/health")
    def health():
        try:
            db.session.execute(db.text("SELECT 1"))
            return jsonify({"status": "ok", "database": "connected"})
        except Exception as exc:
            return jsonify({"status": "error", "database": str(exc)}), 500

    return app


# ── Entry point ────────────────────────────────────────────────────────────────

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=port)
