from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from models import db
from models.team_member import TeamMember
from utils.auth_helpers import get_current_user

team_bp = Blueprint("team", __name__, url_prefix="/api/team")


@team_bp.route("", methods=["GET"])
@jwt_required()
def get_team_members():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404
        
    if not user.business:
        return jsonify({"error": "Business profile not found. Please complete business setup first."}), 400
        
    members = TeamMember.query.filter_by(business_id=user.business.id).order_by(TeamMember.created_at.asc()).all()
    
    # Auto-seed the owner if the list is completely empty
    if not members:
        owner_member = TeamMember(
            business_id=user.business.id,
            name=user.name,
            email=user.email,
            role="Owner",
            status="Active"
        )
        db.session.add(owner_member)
        db.session.commit()
        members = [owner_member]
        
    return jsonify({"members": [m.to_dict() for m in members]}), 200


@team_bp.route("", methods=["POST"])
@jwt_required()
def add_team_member():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404
        
    if not user.business:
        return jsonify({"error": "Business profile not found."}), 400
        
    data = request.get_json() or {}
    for field in ("name", "email", "role"):
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400
            
    email_clean = data["email"].strip().lower()
    existing = TeamMember.query.filter_by(business_id=user.business.id, email=email_clean).first()
    if existing:
        return jsonify({"error": "A team member with this email already exists."}), 400
        
    member = TeamMember(
        business_id=user.business.id,
        name=data["name"].strip(),
        email=email_clean,
        role=data["role"],
        status=data.get("status", "Active")
    )
    db.session.add(member)
    db.session.commit()
    
    return jsonify({"message": "Team member added successfully.", "member": member.to_dict()}), 201


@team_bp.route("/<int:member_id>", methods=["PUT"])
@jwt_required()
def update_team_member(member_id):
    user = get_current_user()
    if not user or not user.business:
        return jsonify({"error": "Business profile not found."}), 400
        
    member = TeamMember.query.filter_by(id=member_id, business_id=user.business.id).first()
    if not member:
        return jsonify({"error": "Team member not found."}), 404
        
    data = request.get_json() or {}
    
    if "name" in data:
        member.name = data["name"].strip()
        
    if "role" in data:
        new_role = data["role"]
        if member.role == "Owner" and new_role != "Owner":
            # Check if this is the only owner
            owners_count = TeamMember.query.filter_by(business_id=user.business.id, role="Owner").count()
            if owners_count <= 1:
                return jsonify({"error": "You must have at least one business Owner active."}), 400
        member.role = new_role
        
    if "status" in data:
        member.status = data["status"]
        
    member.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({"message": "Team member updated successfully.", "member": member.to_dict()}), 200


@team_bp.route("/<int:member_id>", methods=["DELETE"])
@jwt_required()
def delete_team_member(member_id):
    user = get_current_user()
    if not user or not user.business:
        return jsonify({"error": "Business profile not found."}), 400
        
    member = TeamMember.query.filter_by(id=member_id, business_id=user.business.id).first()
    if not member:
        return jsonify({"error": "Team member not found."}), 404
        
    # Prevent deleting the only Owner
    if member.role == "Owner":
        owners_count = TeamMember.query.filter_by(business_id=user.business.id, role="Owner").count()
        if owners_count <= 1:
            return jsonify({"error": "You cannot delete the only business Owner."}), 400
            
    db.session.delete(member)
    db.session.commit()
    
    return jsonify({"message": "Team member removed successfully."}), 200
