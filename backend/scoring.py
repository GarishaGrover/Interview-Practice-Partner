import re

def simple_score_transcript(transcript):
    communication = 0
    technical = 0
    rolefit = 0
    tech_keywords = ["design", "scale", "test", "metric", "latency", "throughput", "debug", "algorithm"]
    role_keywords = ["deploy", "api", "model", "data", "feature", "production"]

    for item in transcript:
        answer = item.get('answer', "").strip()
        if len(answer) >= 150:
            communication += 8
        elif len(answer) >= 50:
            communication += 6
        else:
            communication += 4
        tech_hits = sum(1 for k in tech_keywords if re.search(r"\b" + k + r"\b", answer, re.I))
        role_hits = sum(1 for k in role_keywords if re.search(r"\b" + k + r"\b", answer, re.I))
        technical += min(9, tech_hits * 2)
        rolefit += min(9, role_hits * 2)
    n = max(1, len(transcript))
    return {
        "communication": communication // n,
        "technical": technical // n,
        "rolefit": rolefit // n
    }
