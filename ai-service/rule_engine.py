import re
from typing import List, Dict, Any, Tuple

class RuleEngine:
    def __init__(self):
        # Regex patterns for different fields
        self.patterns = {
            "mrp": re.compile(r'(m\.?r\.?p\.?|rs\.?|₹)\s*[\.:-]?\s*(\d+[\.,]\d{2})', re.IGNORECASE),
            "net_quantity": re.compile(r'(\d+[\.,]?\d*)\s*(g|kg|ml|l|L|mL|gm)\b', re.IGNORECASE),
            "mfg_date": re.compile(r'(mfd|pkd|mfg|packed|manufactured)[\s\w\.:-]*(\d{1,2}[/\-\.]\d{2,4}|[a-zA-Z]{3}\s*\d{2,4})', re.IGNORECASE),
            "expiry_date": re.compile(r'(exp|best\s*before|use\s*by)[\s\w\.:-]*(\d{1,2}[/\-\.]\d{2,4}|[a-zA-Z]{3}\s*\d{2,4}|\d+\s*(months|days|years))', re.IGNORECASE),
            "manufacturer_details": re.compile(r'(mfd\s*by|manufactured\s*by|packed\s*by|marketed\s*by|imported\s*by)', re.IGNORECASE),
            "pin_code": re.compile(r'\b\d{6}\b'),
            "customer_care": re.compile(r'(customer\s*care|consumer\s*care|helpline|toll\s*free|feedback)', re.IGNORECASE),
            "phone": re.compile(r'\b\d{10,11}\b|\b1800[- ]?\d{3}[- ]?\d{3,4}\b'),
            "email": re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'),
            "country_of_origin": re.compile(r'(country\s*of\s*origin|made\s*in)[\s:]*([a-zA-Z\s]+)', re.IGNORECASE),
            "generic_name": re.compile(r'(common\s*name|generic\s*name)[\s:]*([a-zA-Z\s]+)', re.IGNORECASE)
        }

    def _clean_text(self, text: str) -> str:
        # Basic cleanup
        return text.replace('\n', ' ').strip()

    def extract_declarations(self, ocr_results: List[Tuple[Any, str, float]]) -> List[Dict[str, Any]]:
        """
        Extract declarations from OCR results.
        ocr_results format from EasyOCR: [(bbox, text, prob), ...]
        """
        declarations = []
        
        # Combine all text with bounding boxes for context/proximity matching
        combined_text = " ".join([self._clean_text(item[1]) for item in ocr_results])
        
        # 1. MRP
        mrp_match = self.patterns["mrp"].search(combined_text)
        if mrp_match:
            declarations.append({
                "field": "mrp",
                "found": True,
                "value": mrp_match.group(2),
                "raw_match": mrp_match.group(0),
                "confidence": 0.9,
                "rule_reference": "Rule 6(1)(d)"
            })
        else:
            declarations.append({"field": "mrp", "found": False, "value": None})

        # 2. Net Quantity
        qty_match = self.patterns["net_quantity"].search(combined_text)
        if qty_match:
            declarations.append({
                "field": "net_quantity",
                "found": True,
                "value": qty_match.group(0),
                "raw_match": qty_match.group(0),
                "confidence": 0.9,
                "rule_reference": "Rule 6(1)(b)"
            })
        else:
            declarations.append({"field": "net_quantity", "found": False, "value": None})

        # 3. Mfg Date
        mfg_match = self.patterns["mfg_date"].search(combined_text)
        if mfg_match:
            declarations.append({
                "field": "mfg_date",
                "found": True,
                "value": mfg_match.group(2),
                "raw_match": mfg_match.group(0),
                "confidence": 0.85,
                "rule_reference": "Rule 6(1)(e)"
            })
        else:
            declarations.append({"field": "mfg_date", "found": False, "value": None})

        # 4. Expiry Date
        exp_match = self.patterns["expiry_date"].search(combined_text)
        if exp_match:
            declarations.append({
                "field": "expiry_date",
                "found": True,
                "value": exp_match.group(2),
                "raw_match": exp_match.group(0),
                "confidence": 0.85,
                "rule_reference": "Rule 6(1)(f)"
            })
        else:
            declarations.append({"field": "expiry_date", "found": False, "value": None})

        # 5. Manufacturer Details (Proximity based: Keyword + PIN code)
        mfg_details_match = self.patterns["manufacturer_details"].search(combined_text)
        pin_match = self.patterns["pin_code"].search(combined_text)
        
        # Simple heuristic: if we find the keyword or a PIN code, we probably have the address
        if mfg_details_match or pin_match:
             declarations.append({
                "field": "manufacturer_details",
                "found": True,
                "value": "Present", # In a real system, we'd extract the full block of text
                "raw_match": mfg_details_match.group(0) if mfg_details_match else pin_match.group(0),
                "confidence": 0.7,
                "rule_reference": "Rule 6(1)(c)"
            })
        else:
            declarations.append({"field": "manufacturer_details", "found": False, "value": None})

        # 6. Customer Care
        care_match = self.patterns["customer_care"].search(combined_text)
        phone_match = self.patterns["phone"].search(combined_text)
        email_match = self.patterns["email"].search(combined_text)
        
        if care_match or phone_match or email_match:
            val = []
            if phone_match: val.append(phone_match.group(0))
            if email_match: val.append(email_match.group(0))
            
            declarations.append({
                "field": "customer_care",
                "found": True,
                "value": " / ".join(val) if val else "Present",
                "raw_match": care_match.group(0) if care_match else (phone_match.group(0) if phone_match else email_match.group(0)),
                "confidence": 0.8,
                "rule_reference": "Rule 6(1)(g)"
            })
        else:
            declarations.append({"field": "customer_care", "found": False, "value": None})

        # 7. Country of Origin
        country_match = self.patterns["country_of_origin"].search(combined_text)
        if country_match:
            declarations.append({
                "field": "country_of_origin",
                "found": True,
                "value": country_match.group(2).strip(),
                "raw_match": country_match.group(0),
                "confidence": 0.8,
                "rule_reference": "Rule 6(2)"
            })
        else:
            declarations.append({"field": "country_of_origin", "found": False, "value": None})

        # 8. Generic Name (Fallback logic can be complex, just basic keyword for now)
        name_match = self.patterns["generic_name"].search(combined_text)
        if name_match:
            declarations.append({
                "field": "generic_name",
                "found": True,
                "value": name_match.group(2).strip(),
                "raw_match": name_match.group(0),
                "confidence": 0.6,
                "rule_reference": "Rule 6(1)(a)"
            })
        else:
            declarations.append({"field": "generic_name", "found": False, "value": None})

        return declarations
