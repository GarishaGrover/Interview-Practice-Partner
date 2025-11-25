const APIROOT = "http://localhost:5000";
const personaEl = document.getElementById('persona');
const roleEl = document.getElementById('role');
const qcountEl = document.getElementById('qcount');
const startBtn = document.getElementById('start');
const interviewArea = document.getElementById('interview-area');
const questionText = document.getElementById('question-text');
const currentQuestionLabel = document.getElementById('current-question-label');
const speakBtn = document.getElementById('speak-answer');
const typeBtn = document.getElementById('type-answer');
const nextBtn = document.getElementById('next-question');
const feedbackArea = document.getElementById('feedback-area');
const feedbackText = document.getElementById('feedback-text');
const progress = document.getElementById('progress');
const exportBtn = document.getElementById('export-json');
const transcriptArea = document.getElementById('transcript-area');

let currentSessionId = null;
let questions = [];
let answers = [];
let currentIdx = 0;

// Helper: speak text aloud using SpeechSynthesis API
function speakText(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // stop anything currently speaking
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
}

startBtn.onclick = async () => {
    answers = [];
    currentIdx = 0;
    progress.innerText = '';
    currentQuestionLabel.innerText = '';
    questionText.innerText = '';
    transcriptArea.innerHTML = '';
    feedbackArea.style.display = 'none';
    nextBtn.style.display = 'none';

    // Start interview session
    const res = await fetch(APIROOT + "/interview/start", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            persona: personaEl.value,
            role: roleEl.value,
            qcount: qcountEl.value
        })
    });
    const data = await res.json();
    currentSessionId = data.sessionid;
    questions = data.questions;
    showQuestion();
};

function showQuestion() {
    if (currentIdx < questions.length) {
        currentQuestionLabel.innerText = `Current Question (${currentIdx + 1} of ${questions.length})`;
        questionText.innerText = questions[currentIdx];
        feedbackArea.style.display = 'none';
        nextBtn.style.display = 'none';
        progress.innerText = '';
        // Speak the current question aloud!
        speakText(questions[currentIdx]);
    } else {
        currentQuestionLabel.innerText = 'Interview Complete!';
        questionText.innerHTML = '';
        feedbackArea.style.display = 'none';
        nextBtn.style.display = 'none';
        progress.innerText = "Export transcript & scores for review.";
        renderTranscript();
    }
}

typeBtn.onclick = () => {
    const ans = prompt("Type your answer:");
    if (ans) submitAnswer(ans);
};

speakBtn.onclick = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition not supported.');
        return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.start();
    speakBtn.innerText = 'Listening...';

    rec.onend = () => { speakBtn.innerText = 'Speak Answer (use mic)'; };
    rec.onresult = (ev) => {
        const text = ev.results[0][0].transcript;
        if (confirm('You said: "' + text + '". Submit?')) {
            submitAnswer(text);
        }
    };
    rec.onerror = (e) => { alert('Speech recognition error: ' + e.error); };
};

nextBtn.onclick = () => {
    currentIdx++;
    showQuestion();
};

// Send user answer to backend
async function submitAnswer(answerText) {
    if (!answerText) return;
    feedbackArea.style.display = 'block';
    feedbackText.innerText = 'Analyzing answer...';
    try {
        const res = await fetch(APIROOT + "/interview/answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sessionid: currentSessionId,
                answer: answerText
            })
        });
        const data = await res.json();
        answers.push({ question: questions[currentIdx], answer: answerText, feedback: data.feedback });
        feedbackText.innerText = data.feedback;
        // Optionally, speak feedback aloud:
        speakText(data.feedback);
        nextBtn.style.display = data.done ? 'none' : 'inline-block';
        renderTranscript();
        if (data.done) {
            currentIdx++;
            showQuestion();
        }
    } catch (e) {
        feedbackText.innerText = "Error: " + e;
    }
}

// Renders only transcript during the interview
function renderTranscript() {
    let html = "";
    answers.forEach((qa, idx) => {
        html += `<div class="qa"><b>Q${idx + 1}:</b> ${qa.question}<br><b>A:</b> ${qa.answer}<br><span class="hint"><b>Feedback:</b> ${qa.feedback}</span></div>`;
    });
    transcriptArea.innerHTML = html;
}

// Renders transcript + scores on export
exportBtn.onclick = async () => {
    if (!currentSessionId) return;
    const res = await fetch(APIROOT + "/interview/export?sessionid=" + currentSessionId);
    const data = await res.json();

    let scoreHtml = `
      <b>Scores:</b>
      <ul>
        <li>Communication: <b>${data.scores.communication}</b></li>
        <li>Technical: <b>${data.scores.technical}</b></li>
        <li>Role Fit: <b>${data.scores.rolefit}</b></li>
      </ul>
      <b>Transcript:</b>
    `;
    data.transcript.forEach((qa, idx) => {
      scoreHtml += `
        <div class="qa"><b>Q${idx + 1}:</b> ${qa.question}<br>
        <b>A:</b> ${qa.answer}<br>
        <span class="hint"><b>Feedback:</b> ${qa.feedback}</span></div>
      `;
    });
    transcriptArea.innerHTML = scoreHtml;
};
