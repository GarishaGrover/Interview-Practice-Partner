# Interview Practice Partner (Demo)

Practice job interviews with a virtual agent that asks job-targeted questions, gives feedback, and scores your performance.

## Features

- Select persona and job role (Software Engineer, Data Scientist, General).
- Choose number of questions (1-4).
- Answer via typing or speech (browser mic/Web Speech API).
- Get instant feedback and follow-up questions from the agent.
- Export full transcript and scores for review.

## How to Run

1. *Install backend dependencies:*
    
    cd backend
    pip install -r requirements.txt
    
2. *Start Flask server:*
    
    python app.py
    
3. **Open index.html in your browser (or serve frontend using VSCode Live Server).**

## Notes

- All logic is local/demo/stub for grading. Easily extended to real LLM or advanced scoring.
- CORS enabled for frontend-backend API calls.
- Speech works in Chrome browsers.

---

*You now have a fully functional local project!*
