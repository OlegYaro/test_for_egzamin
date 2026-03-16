'use strict';

// ===== CONFIG =====
const QUESTIONS_URL = './doc/questions.json';
const QUIZ_LENGTH   = 30;
const POINTS_CORRECT = 2;
const POINTS_WRONG   = -1;
const PASS_THRESHOLD = 0.6; // 60% of max score to "pass"

// ===== STATE =====
let allQuestions    = [];
let quizQuestions   = [];
let currentIndex    = 0;
let score           = 0;
let correctCount    = 0;
let wrongCount      = 0;

// ===== DOM REFS =====
const screenStart    = document.getElementById('screen-start');
const screenQuiz     = document.getElementById('screen-quiz');
const screenResults  = document.getElementById('screen-results');

const btnStart       = document.getElementById('btn-start');
const btnNext        = document.getElementById('btn-next');
const btnRestart     = document.getElementById('btn-restart');

const questionCounter  = document.getElementById('question-counter');
const currentScoreEl   = document.getElementById('current-score');
const progressBar      = document.getElementById('progress-bar');
const questionText     = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const explanationBox   = document.getElementById('explanation-box');
const explanationText  = document.getElementById('explanation-text');

const finalScore      = document.getElementById('final-score');
const resultEmoji     = document.getElementById('result-emoji');
const resultVerdict   = document.getElementById('result-verdict');
const statCorrect     = document.getElementById('stat-correct');
const statWrong       = document.getElementById('stat-wrong');
const statPercent     = document.getElementById('stat-percent');

// ===== HELPERS =====

/**
 * Fisher-Yates shuffle – mutates and returns the array.
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function updateProgress() {
  const pct = ((currentIndex) / quizQuestions.length) * 100;
  progressBar.style.width = `${pct}%`;
  questionCounter.textContent = `Pytanie ${currentIndex + 1} z ${quizQuestions.length}`;
  currentScoreEl.textContent  = score;
}

// ===== QUIZ LOGIC =====

function initQuiz() {
  quizQuestions = shuffle([...allQuestions]).slice(0, QUIZ_LENGTH);
  currentIndex  = 0;
  score         = 0;
  correctCount  = 0;
  wrongCount    = 0;
  currentScoreEl.textContent = 0;
  progressBar.style.width    = '0%';
  showScreen(screenQuiz);
  renderQuestion();
}

function renderQuestion() {
  const q = quizQuestions[currentIndex];

  // Reset UI
  explanationBox.classList.add('hidden');
  btnNext.classList.add('hidden');
  optionsContainer.innerHTML = '';

  // Progress
  updateProgress();

  // Question text
  questionText.textContent = q.question;

  // Options – shuffle display order each time
  const letters = ['A', 'B', 'C', 'D'];
  const shuffledOptions = shuffle([...q.options]);

  shuffledOptions.forEach((option, idx) => {
    const btn = document.createElement('button');
    btn.className  = 'option-btn';
    btn.dataset.value = option;

    const letterSpan = document.createElement('span');
    letterSpan.className   = 'option-letter';
    letterSpan.textContent = letters[idx];

    const textSpan = document.createElement('span');
    textSpan.textContent = option;

    btn.appendChild(letterSpan);
    btn.appendChild(textSpan);
    btn.addEventListener('click', () => handleAnswer(btn, q));
    optionsContainer.appendChild(btn);
  });
}

function handleAnswer(clickedBtn, question) {
  // Lock all options
  const allBtns = optionsContainer.querySelectorAll('.option-btn');
  allBtns.forEach(b => { b.disabled = true; });

  const chosen  = clickedBtn.dataset.value;
  const correct = question.correct_answer;
  const isRight = chosen === correct;

  if (isRight) {
    score += POINTS_CORRECT;
    correctCount++;
    clickedBtn.classList.add('correct');
  } else {
    score += POINTS_WRONG;
    wrongCount++;
    clickedBtn.classList.add('wrong');

    // Highlight the correct answer
    allBtns.forEach(b => {
      if (b.dataset.value === correct) {
        b.classList.add('correct');
      }
    });

    // Show explanation
    explanationText.textContent = question.explanation;
    explanationBox.classList.remove('hidden');
  }

  currentScoreEl.textContent = score;
  btnNext.classList.remove('hidden');

  // If last question, change button label
  if (currentIndex === quizQuestions.length - 1) {
    btnNext.textContent = 'Zobacz wyniki';
  } else {
    btnNext.textContent = 'Następne pytanie →';
  }
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex < quizQuestions.length) {
    renderQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  const maxScore = quizQuestions.length * POINTS_CORRECT;
  const pct      = Math.round((correctCount / quizQuestions.length) * 100);
  const passed   = score >= Math.floor(maxScore * PASS_THRESHOLD);

  finalScore.textContent     = score;
  statCorrect.textContent    = correctCount;
  statWrong.textContent      = wrongCount;
  statPercent.textContent    = `${pct}%`;

  if (passed) {
    resultEmoji.textContent  = '🏆';
    resultVerdict.textContent = 'Zaliczone! Dobry wynik!';
    resultVerdict.className  = 'result-verdict verdict-pass';
  } else {
    resultEmoji.textContent  = '📚';
    resultVerdict.textContent = 'Niezaliczone – warto powtórzyć materiał.';
    resultVerdict.className  = 'result-verdict verdict-fail';
  }

  // Animate progress bar to 100%
  progressBar.style.width = '100%';

  showScreen(screenResults);
}

// ===== FETCH QUESTIONS =====

async function loadQuestions() {
  try {
    const response = await fetch(QUESTIONS_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Plik questions.json jest pusty lub ma nieprawidłowy format.');
    }
    allQuestions = data;
    btnStart.disabled      = false;
    btnStart.textContent   = 'Rozpocznij Quiz';
  } catch (err) {
    btnStart.textContent = 'Błąd ładowania pytań';
    btnStart.disabled    = true;
    console.error('[Quiz] Nie udało się załadować pytań:', err);
    alert(`Nie udało się załadować pytań.\n\n${err.message}\n\nUpewnij się, że plik doc/questions.json istnieje i jest dostępny.`);
  }
}

// ===== EVENT LISTENERS =====

btnStart.addEventListener('click', () => {
  if (allQuestions.length > 0) initQuiz();
});

btnNext.addEventListener('click', nextQuestion);

btnRestart.addEventListener('click', initQuiz);

// ===== INIT =====

btnStart.disabled    = true;
btnStart.textContent = 'Ładowanie pytań…';
loadQuestions();
