import random

def call_llm(answer, persona="Friendly", question=None):
    good_feedback = [
        "Excellent! You explained concepts with clarity.",
        "Great answer—clear and relevant.",
        "Solid response, well supported by examples.",
        "Nice! You addressed important details."
    ]
    followup = [
        "Can you elaborate further?",
        "What trade-offs did you consider?",
        "How would you handle a different scenario?",
        "Is there a metric you'd use to measure success?"
    ]
    if not answer.strip():
        return "Please provide an answer to get feedback."
    if random.random() > 0.5:
        feedback = random.choice(good_feedback)
    else:
        feedback = f"{random.choice(followup)} {random.choice(good_feedback)}"
    return feedback
