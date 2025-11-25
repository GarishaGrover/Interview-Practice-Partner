from flask import Flask, request, jsonify
from flask_cors import CORS
from llm import call_llm
from scoring import simple_score_transcript
import uuid

app = Flask(__name__)
CORS(app)

# In-memory session storage for demo
sessions = {}

QUESTIONS_BY_ROLE = {
    "Software Engineer": [
        "Tell me about a challenging system design problem you solved.",
        "Explain a bug you found and how you debugged it.",
        "How do you ensure code quality in a team?",
        "Walk me through a recent project and the trade-offs you made."
    ],
    "Data Scientist": [
        "Describe an end-to-end ML project you shipped.",
        "How do you select features for a model?",
        "Explain cross validation and why it's important.",
        "How do you evaluate model fairness?"
    ],
    "General": [
        "Tell me about yourself.",
        "Describe a time you overcame a challenge.",
        "How do you prioritize tasks?",
        "What motivates you at work?"
    ]
}

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/interview/start", methods=["POST"])
def start_interview():
    data = request.json
    persona = data.get("persona", "Friendly")
    role = data.get("role", "General")
    qcount = min(max(int(data.get("qcount", 2)), 1), 4)
    sessionid = str(uuid.uuid4())
    questions = QUESTIONS_BY_ROLE.get(role, QUESTIONS_BY_ROLE["General"])[:qcount]
    sessions[sessionid] = {
        "persona": persona,
        "role": role,
        "questions": questions,
        "answers": []
    }
    return jsonify({"sessionid": sessionid, "questions": questions})

@app.route("/interview/answer", methods=["POST"])
def answer():
    data = request.json
    sessionid = data.get("sessionid")
    answer_text = data.get("answer", "")
    session = sessions.get(sessionid)
    if not session:
        return jsonify({"error": "Invalid session ID"}), 400
    q_idx = len(session["answers"])
    if q_idx >= len(session["questions"]):
        return jsonify({"error": "No more questions."}), 400
    feedback = call_llm(answer_text, persona=session["persona"], question=session["questions"][q_idx])
    session["answers"].append({
        "question": session["questions"][q_idx],
        "answer": answer_text,
        "feedback": feedback
    })
    return jsonify({"feedback": feedback, "idx": q_idx + 1, "done": q_idx + 1 == len(session["questions"])})

@app.route("/interview/export", methods=["GET"])
def export():
    sessionid = request.args.get("sessionid")
    session = sessions.get(sessionid)
    if not session:
        return jsonify({"error": "Invalid session ID"}), 400
    scores = simple_score_transcript(session["answers"])
    return jsonify({"transcript": session["answers"], "scores": scores})

if __name__ == "__main__":
    app.run(debug=True)
