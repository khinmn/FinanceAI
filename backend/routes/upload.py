import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
from middleware.auth_middleware import (
    require_role,
    ROLE_OWNER, ROLE_PERSONAL, ROLE_MANAGER, ROLE_EMPLOYEE,
)

upload_bp = Blueprint("upload", __name__, url_prefix="/api/upload")

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@upload_bp.route("/receipt", methods=["POST"])
@require_role(ROLE_OWNER, ROLE_PERSONAL, ROLE_MANAGER, ROLE_EMPLOYEE)
def upload_receipt():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not file or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Allowed: PNG, JPG, JPEG, PDF."}), 400

    try:
        # Resolve upload folder path
        upload_folder = os.path.join(current_app.root_path, "uploads", "receipts")
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder, exist_ok=True)

        # Generate a unique secure filename
        ext = file.filename.rsplit(".", 1)[1].lower()
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        safe_name = secure_filename(unique_name)
        filepath = os.path.join(upload_folder, safe_name)

        # Save the file
        file.save(filepath)

        # Return static-serving friendly URL path
        receipt_url = f"/uploads/{safe_name}"
        return jsonify({"message": "File uploaded successfully.", "receipt_url": receipt_url}), 201

    except Exception as e:
        return jsonify({"error": f"Failed to upload receipt: {str(e)}"}), 500
