import json
import os
from typing import List, Dict, Any

class ComplianceChecker:
    def __init__(self, rules_path: str = "rules.json"):
        self.rules = self._load_rules(rules_path)

    def _load_rules(self, rules_path: str) -> List[Dict[str, Any]]:
        if not os.path.exists(rules_path):
            raise FileNotFoundError(f"Rules file not found at {rules_path}")
        with open(rules_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def evaluate(self, extracted_declarations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evaluate extracted declarations against rules.
        """
        violations = []
        total_penalty = 0
        
        # Convert list to dict for easier lookup
        decls_by_field = {d['field']: d for d in extracted_declarations}
        
        severity_weights = {
            "HIGH": 30,
            "MEDIUM": 15,
            "LOW": 5
        }

        for rule in self.rules:
            field = rule["field"]
            is_required = rule["required"]
            
            # Check if required field is missing
            if is_required:
                decl = decls_by_field.get(field)
                if not decl or not decl.get("found"):
                    penalty = severity_weights.get(rule["severity"], 0)
                    total_penalty += penalty
                    
                    violations.append({
                        "rule_id": rule["id"],
                        "field": field,
                        "description": f"Missing mandatory declaration: {rule['description']}",
                        "severity": rule["severity"],
                        "rule_reference": rule["rule_number"]
                    })
                    
        # Calculate Risk Score (0-100)
        risk_score = max(0, 100 - total_penalty)
        
        # Determine Compliance Status
        compliance_status = "COMPLIANT" if len(violations) == 0 else "NON_COMPLIANT"
        
        return {
            "status": compliance_status,
            "risk_score": risk_score,
            "violations": violations
        }
