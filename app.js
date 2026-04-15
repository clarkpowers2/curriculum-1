// =====================================================================
// Private Tutor – app.js
// All data is persisted in localStorage so progress survives page reloads.
// =====================================================================

// ===== State =====
const state = {
  lessons: [],
  flashcards: [],
  quizHistory: [],
  editingLessonId: null,
};

// ===== Persistence =====
function save() {
  localStorage.setItem('pt_lessons',    JSON.stringify(state.lessons));
  localStorage.setItem('pt_flashcards', JSON.stringify(state.flashcards));
  localStorage.setItem('pt_quiz_history', JSON.stringify(state.quizHistory));
}

function load() {
  state.lessons      = JSON.parse(localStorage.getItem('pt_lessons')      || '[]');
  state.flashcards   = JSON.parse(localStorage.getItem('pt_flashcards')   || '[]');
  state.quizHistory  = JSON.parse(localStorage.getItem('pt_quiz_history') || '[]');

  // Seed sample data on first run
  if (state.lessons.length === 0 && state.flashcards.length === 0) {
    seedSampleData();
  }
}

function seedSampleData() {
  state.lessons = [
    {
      id: uid(),
      subject: 'Mathematics',
      title: 'The Quadratic Formula',
      content: 'The quadratic formula solves ax² + bx + c = 0:\n\nx = (−b ± √(b² − 4ac)) / 2a\n\nThe discriminant b² − 4ac tells you the number of real roots:\n• > 0 → two distinct real roots\n• = 0 → one repeated real root\n• < 0 → no real roots (complex roots)',
    },
    {
      id: uid(),
      subject: 'Science',
      title: "Newton's Three Laws of Motion",
      content: "1. An object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force (Law of Inertia).\n\n2. Force equals mass times acceleration: F = ma.\n\n3. For every action there is an equal and opposite reaction.",
    },
    {
      id: uid(),
      subject: 'History',
      title: 'The French Revolution',
      content: 'The French Revolution (1789–1799) was a period of radical political and societal change in France. It began with the financial crisis of the French state and popular dissatisfaction with the monarchy, leading to the abolition of the monarchy and the establishment of a republic. Key events include the storming of the Bastille (1789) and the Reign of Terror (1793–1794).',
    },
  ];

  state.flashcards = [
    { id: uid(), subject: 'Mathematics', question: 'What is the quadratic formula?', answer: 'x = (−b ± √(b² − 4ac)) / 2a' },
    { id: uid(), subject: 'Mathematics', question: 'What does the discriminant tell you?', answer: 'The number of real roots: >0 → two roots, =0 → one root, <0 → no real roots' },
    { id: uid(), subject: 'Science',     question: "State Newton's First Law", answer: 'An object at rest stays at rest; an object in motion stays in motion unless acted on by an external force.' },
    { id: uid(), subject: 'Science',     question: "State Newton's Second Law", answer: 'F = ma (Force equals mass times acceleration)' },
    { id: uid(), subject: 'History',     question: 'When did the French Revolution begin?', answer: '1789' },
    { id: uid(), subject: 'History',     question: 'What was the Bastille?', answer: 'A medieval fortress and prison in Paris; its storming on 14 July 1789 became a symbol of the Revolution.' },
  ];

  save();
}

// ===== Utilities =====
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function uniqueSubjects(arr) {
  const subjects = arr.map(x => x.subject).filter(Boolean);
  return [...new Set(subjects)].sort();
}

function populateSubjectFilter(selectEl, arr) {
  const current = selectEl.value;
  selectEl.innerHTML = '<option value="all">All Subjects</option>';
  uniqueSubjects(arr).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    selectEl.appendChild(opt);
  });
  if ([...selectEl.options].some(o => o.value === current)) {
    selectEl.value = current;
  }
}

// ===== Navigation =====
const navBtns = document.querySelectorAll('.nav-btn');
const views   = document.querySelectorAll('.view');

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    views.forEach(v => v.classList.add('hidden'));
    btn.classList.add('active');
    const target = document.getElementById('view-' + btn.dataset.view);
    target.classList.remove('hidden');
    if (btn.dataset.view === 'progress') renderProgress();
  });
});

// ===== Lessons =====
const lessonList         = document.getElementById('lesson-list');
const subjectFilter      = document.getElementById('subject-filter');
const addLessonBtn       = document.getElementById('add-lesson-btn');
const lessonModal        = document.getElementById('lesson-modal');
const lessonModalTitle   = document.getElementById('lesson-modal-title');
const lessonSubjectInput = document.getElementById('lesson-subject');
const lessonTitleInput   = document.getElementById('lesson-title');
const lessonContentInput = document.getElementById('lesson-content');
const saveLessonBtn      = document.getElementById('save-lesson-btn');
const cancelLessonBtn    = document.getElementById('cancel-lesson-btn');

function renderLessons() {
  populateSubjectFilter(subjectFilter, state.lessons);
  populateSubjectFilter(document.getElementById('quiz-subject'), state.flashcards);

  const filter = subjectFilter.value;
  const filtered = filter === 'all'
    ? state.lessons
    : state.lessons.filter(l => l.subject === filter);

  if (filtered.length === 0) {
    lessonList.innerHTML = '<div class="empty-state"><div class="empty-icon">📖</div>No lessons yet. Click "+ Add Lesson" to get started!</div>';
    return;
  }

  lessonList.innerHTML = filtered.map(lesson => `
    <div class="lesson-card" data-id="${lesson.id}">
      <span class="subject-tag">${escHtml(lesson.subject)}</span>
      <h3>${escHtml(lesson.title)}</h3>
      <p>${escHtml(lesson.content)}</p>
      <div class="card-actions">
        <button class="btn btn-secondary edit-lesson-btn" data-id="${lesson.id}">✏️ Edit</button>
        <button class="btn btn-danger delete-lesson-btn" data-id="${lesson.id}">🗑️ Delete</button>
      </div>
    </div>
  `).join('');

  lessonList.querySelectorAll('.edit-lesson-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditLesson(btn.dataset.id));
  });
  lessonList.querySelectorAll('.delete-lesson-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteLesson(btn.dataset.id));
  });
}

subjectFilter.addEventListener('change', renderLessons);

addLessonBtn.addEventListener('click', () => {
  state.editingLessonId = null;
  lessonModalTitle.textContent = 'Add Lesson';
  lessonSubjectInput.value = '';
  lessonTitleInput.value = '';
  lessonContentInput.value = '';
  lessonModal.classList.remove('hidden');
  lessonSubjectInput.focus();
});

cancelLessonBtn.addEventListener('click', () => {
  lessonModal.classList.add('hidden');
});

lessonModal.addEventListener('click', e => {
  if (e.target === lessonModal) lessonModal.classList.add('hidden');
});

saveLessonBtn.addEventListener('click', () => {
  const subject = lessonSubjectInput.value.trim();
  const title   = lessonTitleInput.value.trim();
  const content = lessonContentInput.value.trim();
  if (!subject || !title || !content) {
    alert('Please fill in all fields.');
    return;
  }
  if (state.editingLessonId) {
    const lesson = state.lessons.find(l => l.id === state.editingLessonId);
    if (lesson) { lesson.subject = subject; lesson.title = title; lesson.content = content; }
  } else {
    state.lessons.unshift({ id: uid(), subject, title, content });
  }
  save();
  lessonModal.classList.add('hidden');
  renderLessons();
});

function openEditLesson(id) {
  const lesson = state.lessons.find(l => l.id === id);
  if (!lesson) return;
  state.editingLessonId = id;
  lessonModalTitle.textContent = 'Edit Lesson';
  lessonSubjectInput.value = lesson.subject;
  lessonTitleInput.value   = lesson.title;
  lessonContentInput.value = lesson.content;
  lessonModal.classList.remove('hidden');
  lessonTitleInput.focus();
}

function deleteLesson(id) {
  if (!confirm('Delete this lesson?')) return;
  state.lessons = state.lessons.filter(l => l.id !== id);
  save();
  renderLessons();
}

// ===== Flashcards =====
const flashcardSubjectFilter = document.getElementById('flashcard-subject-filter');
const addCardBtn             = document.getElementById('add-card-btn');
const flashcardStudy         = document.getElementById('flashcard-study');
const flashcard              = document.getElementById('flashcard');
const cardQuestion           = document.getElementById('card-question');
const cardAnswer             = document.getElementById('card-answer');
const cardCounter            = document.getElementById('card-counter');
const prevCardBtn            = document.getElementById('prev-card-btn');
const nextCardBtn            = document.getElementById('next-card-btn');
const flashcardList          = document.getElementById('flashcard-list');
const cardModal              = document.getElementById('card-modal');
const cardSubjectInput       = document.getElementById('card-subject');
const cardQuestionInput      = document.getElementById('card-question-input');
const cardAnswerInput        = document.getElementById('card-answer-input');
const saveCardBtn            = document.getElementById('save-card-btn');
const cancelCardBtn          = document.getElementById('cancel-card-btn');

let fcIndex = 0;
let fcFiltered = [];

function renderFlashcards() {
  populateSubjectFilter(flashcardSubjectFilter, state.flashcards);
  const filter = flashcardSubjectFilter.value;
  fcFiltered = filter === 'all'
    ? [...state.flashcards]
    : state.flashcards.filter(c => c.subject === filter);

  if (fcFiltered.length > 0) {
    flashcardStudy.classList.remove('hidden');
    fcIndex = Math.min(fcIndex, fcFiltered.length - 1);
    showCard(fcIndex);
  } else {
    flashcardStudy.classList.add('hidden');
  }

  if (fcFiltered.length === 0) {
    flashcardList.innerHTML = '<div class="empty-state"><div class="empty-icon">🃏</div>No flashcards yet. Click "+ Add Card" to create some!</div>';
    return;
  }

  flashcardList.innerHTML = fcFiltered.map(card => `
    <div class="fc-card">
      <span class="subject-tag">${escHtml(card.subject)}</span>
      <span class="q-label">Q</span>
      <p>${escHtml(card.question)}</p>
      <span class="q-label">A</span>
      <p>${escHtml(card.answer)}</p>
      <div class="card-actions">
        <button class="btn btn-danger delete-card-btn" data-id="${card.id}">🗑️ Delete</button>
      </div>
    </div>
  `).join('');

  flashcardList.querySelectorAll('.delete-card-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteCard(btn.dataset.id));
  });
}

function showCard(index) {
  flashcard.classList.remove('flipped');
  const card = fcFiltered[index];
  cardQuestion.textContent = card.question;
  cardAnswer.textContent   = card.answer;
  cardCounter.textContent  = `${index + 1} / ${fcFiltered.length}`;
  prevCardBtn.disabled = index === 0;
  nextCardBtn.disabled = index === fcFiltered.length - 1;
}

flashcard.addEventListener('click', () => {
  flashcard.classList.toggle('flipped');
});

prevCardBtn.addEventListener('click', () => {
  if (fcIndex > 0) { fcIndex--; showCard(fcIndex); }
});

nextCardBtn.addEventListener('click', () => {
  if (fcIndex < fcFiltered.length - 1) { fcIndex++; showCard(fcIndex); }
});

flashcardSubjectFilter.addEventListener('change', () => {
  fcIndex = 0;
  renderFlashcards();
});

addCardBtn.addEventListener('click', () => {
  cardSubjectInput.value  = '';
  cardQuestionInput.value = '';
  cardAnswerInput.value   = '';
  cardModal.classList.remove('hidden');
  cardSubjectInput.focus();
});

cancelCardBtn.addEventListener('click', () => cardModal.classList.add('hidden'));
cardModal.addEventListener('click', e => { if (e.target === cardModal) cardModal.classList.add('hidden'); });

saveCardBtn.addEventListener('click', () => {
  const subject  = cardSubjectInput.value.trim();
  const question = cardQuestionInput.value.trim();
  const answer   = cardAnswerInput.value.trim();
  if (!subject || !question || !answer) { alert('Please fill in all fields.'); return; }
  state.flashcards.unshift({ id: uid(), subject, question, answer });
  save();
  cardModal.classList.add('hidden');
  fcIndex = 0;
  renderFlashcards();
});

function deleteCard(id) {
  if (!confirm('Delete this flashcard?')) return;
  state.flashcards = state.flashcards.filter(c => c.id !== id);
  save();
  fcIndex = 0;
  renderFlashcards();
}

// ===== Quiz =====
const quizSubject     = document.getElementById('quiz-subject');
const quizCountInput  = document.getElementById('quiz-count');
const startQuizBtn    = document.getElementById('start-quiz-btn');
const quizSetup       = document.getElementById('quiz-setup');
const quizSession     = document.getElementById('quiz-session');
const quizResults     = document.getElementById('quiz-results');
const quizProgressTxt = document.getElementById('quiz-progress-text');
const quizScoreTxt    = document.getElementById('quiz-score-text');
const quizQuestionTxt = document.getElementById('quiz-question-text');
const quizOptions     = document.getElementById('quiz-options');
const quizFeedback    = document.getElementById('quiz-feedback');
const quizNextBtn     = document.getElementById('quiz-next-btn');
const quizFinalScore  = document.getElementById('quiz-final-score');
const quizRetryBtn    = document.getElementById('quiz-retry-btn');
const quizBackBtn     = document.getElementById('quiz-back-btn');

let quizQuestions = [];
let quizCurrent   = 0;
let quizScore     = 0;

function buildQuizQuestions(filter, count) {
  const pool = filter === 'all'
    ? state.flashcards
    : state.flashcards.filter(c => c.subject === filter);

  if (pool.length < 2) return [];

  // Shuffle
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const chosen   = shuffled.slice(0, Math.min(count, shuffled.length));

  return chosen.map(card => {
    // Generate 3 wrong answers from the pool (excluding the correct one)
    const others = pool.filter(c => c.id !== card.id);
    const wrong  = [...others].sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.answer);
    const options = [...wrong, card.answer].sort(() => Math.random() - 0.5);
    return { question: card.question, answer: card.answer, options };
  });
}

startQuizBtn.addEventListener('click', () => {
  const filter = quizSubject.value;
  const count  = parseInt(quizCountInput.value, 10) || 5;
  quizQuestions = buildQuizQuestions(filter, count);

  if (quizQuestions.length === 0) {
    alert('Not enough flashcards to run a quiz. Please add at least 2 flashcards.');
    return;
  }

  quizCurrent = 0;
  quizScore   = 0;
  quizSetup.classList.add('hidden');
  quizResults.classList.add('hidden');
  quizSession.classList.remove('hidden');
  showQuizQuestion();
});

function showQuizQuestion() {
  const q = quizQuestions[quizCurrent];
  quizProgressTxt.textContent = `Question ${quizCurrent + 1} of ${quizQuestions.length}`;
  quizScoreTxt.textContent    = `Score: ${quizScore}`;
  quizQuestionTxt.textContent = q.question;
  quizFeedback.classList.add('hidden');
  quizFeedback.className = 'quiz-feedback hidden';
  quizNextBtn.classList.add('hidden');

  quizOptions.innerHTML = q.options.map((opt, i) => `
    <button class="quiz-option" data-index="${i}">${escHtml(opt)}</button>
  `).join('');

  quizOptions.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => selectAnswer(btn, q));
  });
}

function selectAnswer(btn, q) {
  // Disable all options
  quizOptions.querySelectorAll('.quiz-option').forEach(b => {
    b.disabled = true;
    if (b.textContent === q.answer) b.classList.add('correct');
  });

  const isCorrect = btn.textContent === q.answer;
  if (isCorrect) {
    quizScore++;
    btn.classList.add('correct');
    quizFeedback.textContent  = '✅ Correct!';
    quizFeedback.className    = 'quiz-feedback correct';
  } else {
    btn.classList.add('wrong');
    quizFeedback.textContent = `❌ Incorrect. The correct answer is: ${q.answer}`;
    quizFeedback.className   = 'quiz-feedback wrong';
  }
  quizFeedback.classList.remove('hidden');
  quizScoreTxt.textContent = `Score: ${quizScore}`;

  if (quizCurrent < quizQuestions.length - 1) {
    quizNextBtn.classList.remove('hidden');
  } else {
    setTimeout(finishQuiz, 900);
  }
}

quizNextBtn.addEventListener('click', () => {
  quizCurrent++;
  showQuizQuestion();
});

function finishQuiz() {
  quizSession.classList.add('hidden');
  quizResults.classList.remove('hidden');

  const pct = Math.round((quizScore / quizQuestions.length) * 100);
  quizFinalScore.textContent = `You scored ${quizScore} / ${quizQuestions.length} (${pct}%)`;

  // Record history
  state.quizHistory.unshift({
    date: new Date().toLocaleString(),
    subject: quizSubject.value,
    score: quizScore,
    total: quizQuestions.length,
    pct,
  });
  if (state.quizHistory.length > 20) state.quizHistory.length = 20;
  save();
}

quizRetryBtn.addEventListener('click', () => {
  quizResults.classList.add('hidden');
  quizSession.classList.remove('hidden');
  quizCurrent = 0;
  quizScore   = 0;
  showQuizQuestion();
});

quizBackBtn.addEventListener('click', () => {
  quizResults.classList.add('hidden');
  quizSetup.classList.remove('hidden');
});

// ===== Progress =====
const progressStats = document.getElementById('progress-stats');
const historyList   = document.getElementById('history-list');

function renderProgress() {
  // Stats
  const totalLessons    = state.lessons.length;
  const totalCards      = state.flashcards.length;
  const totalQuizzes    = state.quizHistory.length;
  const avgScore        = totalQuizzes
    ? Math.round(state.quizHistory.reduce((s, q) => s + q.pct, 0) / totalQuizzes)
    : 0;

  progressStats.innerHTML = [
    { value: totalLessons, label: 'Lessons' },
    { value: totalCards,   label: 'Flashcards' },
    { value: totalQuizzes, label: 'Quizzes Taken' },
    { value: totalQuizzes ? avgScore + '%' : '—', label: 'Avg Quiz Score' },
  ].map(s => `
    <div class="stat-card">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join('');

  // History
  if (state.quizHistory.length === 0) {
    historyList.innerHTML = '<p style="color:var(--text-light)">No quizzes taken yet.</p>';
    return;
  }

  historyList.innerHTML = state.quizHistory.map(q => {
    const cls = q.pct >= 80 ? 'score-high' : q.pct >= 50 ? 'score-mid' : 'score-low';
    return `
      <div class="history-item">
        <span>${q.date} — <strong>${q.subject === 'all' ? 'All Subjects' : q.subject}</strong></span>
        <span class="score-badge ${cls}">${q.score}/${q.total} (${q.pct}%)</span>
      </div>
    `;
  }).join('');
}

// ===== Init =====
load();
renderLessons();
renderFlashcards();
populateSubjectFilter(quizSubject, state.flashcards);
