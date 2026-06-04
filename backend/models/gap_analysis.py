import json
from datetime import datetime
from . import db


class GapAnalysisResult(db.Model):
    __tablename__ = "gap_analysis_results"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    period_start = db.Column(db.Date, nullable=True)
    period_end = db.Column(db.Date, nullable=True)
    # Rule findings stored as JSON text
    _rule_findings = db.Column("rule_findings", db.Text, nullable=True)
    ai_explanation = db.Column(db.Text, nullable=True)
    # good | fair | warning | critical
    overall_health = db.Column(db.String(20), default="unknown")

    # Relationships
    user = db.relationship("User", back_populates="gap_analyses")

    # ── JSON property helpers ───────────────────────────────────────────────────
    @property
    def rule_findings(self) -> list:
        if self._rule_findings:
            return json.loads(self._rule_findings)
        return []

    @rule_findings.setter
    def rule_findings(self, value: list) -> None:
        self._rule_findings = json.dumps(value)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "generated_at": self.generated_at.isoformat(),
            "period_start": self.period_start.isoformat() if self.period_start else None,
            "period_end": self.period_end.isoformat() if self.period_end else None,
            "rule_findings": self.rule_findings,
            "ai_explanation": self.ai_explanation,
            "overall_health": self.overall_health,
            "finding_count": len(self.rule_findings),
        }
