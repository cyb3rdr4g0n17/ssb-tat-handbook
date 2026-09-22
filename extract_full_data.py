import docx, re, json

KNOWN_DOMAINS = [
    ('01', 'Fitness & Sports'),
    ('02', 'Armed Forces'),
    ('03', 'Police & Law Enforcement'),
    ('04', 'Civil Services & Government'),
    ('05', 'Education & Academia'),
    ('06', 'Medical & Healthcare'),
    ('07', 'Engineering'),
    ('08', 'It & Technology'),
    ('09', 'Science & Research'),
    ('10', 'Skilled Trades'),
    ('11', 'Agriculture & Rural Development'),
    ('12', 'Business & Entrepreneurship'),
    ('13', 'Finance & Banking'),
    ('14', 'Corporate & Management'),
    ('15', 'Law & Legal Services'),
    ('16', 'Hospitality & Tourism'),
    ('17', 'Transport & Aviation'),
    ('18', 'Media & Communication'),
    ('19', 'Creative & Design'),
    ('20', 'Environment & Wildlife'),
    ('21', 'Disaster Management & Emergency Services'),
    ('22', 'Social Work & Development'),
    ('23', 'Logistics & Supply Chain'),
    ('24', 'Architecture, Construction & Real Estate'),
    ('25', 'Emerging & Modern Professions')
]

def parse_handbook():
    print("Loading document...")
    doc = docx.Document('Professions_Detailed_TAT_Guide_Improved.docx')
    raw_lines = [p.text.replace('\xa0', ' ').strip() for p in doc.paragraphs if p.text.replace('\xa0', ' ').strip()]
    
    lines = []
    for l in raw_lines:
        if re.match(r'^Professions\s*-\s*SSB.*$', l) or re.match(r'^\d+$', l):
            continue
        lines.append(l)
        
    print(f"Clean lines to parse: {len(lines)}")
    
    data = {
        "title": "Professions - SSB / TAT Career & Profession Reference Handbook",
        "subtitle": "459 professions across 25 career domains - Improved edition",
        "core_action_logic": [
            {"step": 1, "name": "OBSERVE", "description": "Identify the people, place, resources and immediate problem."},
            {"step": 2, "name": "IDENTIFY", "description": "Define the actual problem instead of reacting emotionally."},
            {"step": 3, "name": "PLAN", "description": "Choose a workable sequence using available resources."},
            {"step": 4, "name": "INITIATE", "description": "Take the first useful action; avoid passive waiting."},
            {"step": 5, "name": "COORDINATE", "description": "Involve the right people and communicate clearly."},
            {"step": 6, "name": "EXECUTE", "description": "Carry out the plan while adapting to new information."},
            {"step": 7, "name": "RESULT", "description": "Show a realistic, measurable or observable outcome."}
        ],
        "tat_framework_rules": [
            "Observe -> Identify -> Plan -> Initiate -> Coordinate -> Execute -> Result",
            "Use the profession as a source of realistic action. Do not force a profession into the picture.",
            "If a profession is relevant, use its knowledge, tools, responsibilities and work environment to create a practical response.",
            "The OLQ labels are practice prompts, not a claim about how any individual candidate will be assessed."
        ],
        "domains": [],
        "situation_bank": [],
        "checklist": {
            "questions": [],
            "mistakes_to_avoid": []
        }
    }

    part3_idx = len(lines)
    part4_idx = len(lines)
    part5_idx = len(lines)

    for i, l in enumerate(lines):
        if 'PART III - TAT SITUATION BANK' in l:
            part3_idx = i
        elif 'PART IV - QUICK REFERENCE: TAT CHECKLIST' in l:
            part4_idx = i
        elif 'PART V - PRACTICE SHEETS' in l:
            part5_idx = i

    print(f"Section indices: Part III at {part3_idx}, Part IV at {part4_idx}, Part V at {part5_idx}")

    # Build domain map
    domain_lookup = {f"{d_id}. {d_title}".lower(): (d_id, d_title) for d_id, d_title in KNOWN_DOMAINS}
    
    prof_re = re.compile(r'^(\d+)\.\s+(.+)$')
    
    current_domain = None
    current_prof = None
    state = None
    pattern_type = None

    for idx in range(52, part3_idx):
        line = lines[idx]

        # Check if line is a known domain header
        norm_line = line.lower().strip()
        matched_domain = None
        for key, (did, dtitle) in domain_lookup.items():
            if norm_line == key:
                matched_domain = (did, dtitle)
                break
        
        if matched_domain:
            current_domain = {
                "id": matched_domain[0],
                "title": matched_domain[1],
                "focus": "",
                "professions": []
            }
            data["domains"].append(current_domain)
            current_prof = None
            state = "domain_focus"
            continue

        if state == "domain_focus":
            if current_domain and not current_domain["focus"]:
                current_domain["focus"] = line
                state = None
                continue

        # Check for profession header: e.g. "1. Nutritionist" followed by "WORK ENVIRONMENT"
        pm = prof_re.match(line)
        if pm and (idx + 1 < len(lines) and lines[idx+1] == "WORK ENVIRONMENT"):
            prof_num = int(pm.group(1))
            prof_name = pm.group(2).strip()
            current_prof = {
                "id": prof_num,
                "name": prof_name,
                "domain_id": current_domain["id"] if current_domain else "",
                "domain_title": current_domain["title"] if current_domain else "",
                "work_environment": "",
                "professional_workflow": "",
                "patterns": {
                    "routine": "",
                    "problem_crisis": "",
                    "team_community": ""
                },
                "practical_action_sequence": "",
                "olqs": []
            }
            if current_domain:
                current_domain["professions"].append(current_prof)
            state = None
            continue

        if line == "WORK ENVIRONMENT":
            state = "env"
            continue
        elif line == "PROFESSIONAL WORKFLOW":
            state = "workflow"
            continue
        elif line == "TAT PRACTICE PATTERNS":
            state = "patterns"
            pattern_type = None
            continue
        elif line == "PRACTICAL ACTION SEQUENCE":
            state = "action"
            continue
        elif line == "OLQs NATURALLY EXERCISED":
            state = "olqs"
            continue

        if current_prof:
            if state == "env":
                current_prof["work_environment"] = (current_prof["work_environment"] + " " + line).strip()
            elif state == "workflow":
                current_prof["professional_workflow"] = (current_prof["professional_workflow"] + " " + line).strip()
            elif state == "patterns":
                if line.startswith("A. Routine:"):
                    current_prof["patterns"]["routine"] = line[len("A. Routine:"):].strip()
                    pattern_type = "routine"
                elif line.startswith("B. Problem / Crisis:"):
                    current_prof["patterns"]["problem_crisis"] = line[len("B. Problem / Crisis:"):].strip()
                    pattern_type = "problem_crisis"
                elif line.startswith("C. Team / Community:"):
                    current_prof["patterns"]["team_community"] = line[len("C. Team / Community:"):].strip()
                    pattern_type = "team_community"
                else:
                    if pattern_type:
                        current_prof["patterns"][pattern_type] = (current_prof["patterns"][pattern_type] + " " + line).strip()
            elif state == "action":
                current_prof["practical_action_sequence"] = (current_prof["practical_action_sequence"] + " " + line).strip()
            elif state == "olqs":
                parts = [p.strip() for p in line.split("->") if p.strip()]
                for p in parts:
                    if p not in current_prof["olqs"]:
                        current_prof["olqs"].append(p)

    # Parse Part III - Situation Bank
    sit_re = re.compile(r'^(\d{2})\.\s+(.+)$')
    current_sit = None
    for idx in range(part3_idx + 1, part4_idx):
        line = lines[idx]
        sm = sit_re.match(line)
        if sm:
            current_sit = {
                "id": sm.group(1),
                "title": sm.group(2),
                "description": "",
                "practice_flow": ""
            }
            data["situation_bank"].append(current_sit)
            continue
        if current_sit:
            if line.startswith("Practice:"):
                current_sit["practice_flow"] = line[len("Practice:"):].strip()
            else:
                current_sit["description"] = (current_sit["description"] + " " + line).strip()

    # Parse Part IV - Quick Reference: TAT Checklist
    in_mistakes = False
    chk_re = re.compile(r'^\d+\.\s+\[\s*\]\s*(.+)$')
    for idx in range(part4_idx + 1, part5_idx):
        line = lines[idx]
        if "Common mistakes to avoid" in line:
            in_mistakes = True
            continue
        if not in_mistakes:
            cm = chk_re.match(line)
            if cm:
                data["checklist"]["questions"].append(cm.group(1).strip())
        else:
            if line.startswith("->") or line.startswith("-"):
                data["checklist"]["mistakes_to_avoid"].append(line.lstrip("-> -").strip())

    total_profs = sum(len(d["professions"]) for d in data["domains"])
    print(f"Extracted {len(data['domains'])} domains, total {total_profs} professions!")
    print(f"Extracted {len(data['situation_bank'])} situations in Situation Bank")
    print(f"Extracted {len(data['checklist']['questions'])} checklist questions")
    print(f"Extracted {len(data['checklist']['mistakes_to_avoid'])} mistakes to avoid")

    with open('ssb_tat_handbook.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Saved to ssb_tat_handbook.json successfully!")

if __name__ == '__main__':
    parse_handbook()
