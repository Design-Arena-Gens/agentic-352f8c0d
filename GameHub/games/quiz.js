const QUESTIONS = [
  {
    prompt: 'What is the capital city of Australia?',
    options: ['Sydney', 'Canberra', 'Melbourne', 'Perth'],
    answer: 1
  },
  {
    prompt: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Neptune'],
    answer: 1
  },
  {
    prompt: 'What year did the World Wide Web become publicly available?',
    options: ['1989', '1991', '1995', '1998'],
    answer: 1
  },
  {
    prompt: 'Which language is primarily used for styling web pages?',
    options: ['HTML', 'CSS', 'Python', 'SQL'],
    answer: 1
  },
  {
    prompt: 'How many players are on the field for one soccer team?',
    options: ['9', '10', '11', '12'],
    answer: 2
  },
  {
    prompt: 'Which element has the chemical symbol "O"?',
    options: ['Gold', 'Oxygen', 'Osmium', 'Carbon'],
    answer: 1
  },
  {
    prompt: 'What is the largest organ in the human body?',
    options: ['Heart', 'Skin', 'Liver', 'Lungs'],
    answer: 1
  },
  {
    prompt: 'Who wrote the novel "1984"?',
    options: ['George Orwell', 'Aldous Huxley', 'Ray Bradbury', 'Isaac Asimov'],
    answer: 0
  },
  {
    prompt: 'Which gas do plants primarily take in?',
    options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
    answer: 2
  },
  {
    prompt: 'What is the smallest prime number?',
    options: ['0', '1', '2', '3'],
    answer: 2
  }
];

export function createQuizGame(root, { soundManager, onComplete }) {
  const container = document.createElement('div');
  container.className = 'w-full max-w-xl mx-auto space-y-6';
  root.appendChild(container);

  const questionEl = document.createElement('div');
  questionEl.className = 'bg-slate-900/70 border border-slate-800 rounded-2xl p-6';
  const promptEl = document.createElement('h3');
  promptEl.className = 'text-xl font-semibold mb-4';
  const optionsEl = document.createElement('div');
  optionsEl.className = 'grid gap-3';
  questionEl.appendChild(promptEl);
  questionEl.appendChild(optionsEl);

  const metaEl = document.createElement('div');
  metaEl.className = 'flex items-center justify-between text-sm text-slate-300';
  const progressEl = document.createElement('div');
  progressEl.className = 'w-full h-2 bg-slate-800 rounded-full overflow-hidden';
  const barEl = document.createElement('div');
  barEl.className = 'h-full bg-emerald-500 transition-all';
  progressEl.appendChild(barEl);
  const timerEl = document.createElement('span');
  const scoreEl = document.createElement('span');

  metaEl.appendChild(timerEl);
  metaEl.appendChild(scoreEl);

  container.appendChild(metaEl);
  container.appendChild(progressEl);
  container.appendChild(questionEl);

  const state = {
    questions: shuffle([...QUESTIONS]).slice(0, 6),
    index: 0,
    score: 0,
    correct: 0,
    startTime: Date.now(),
    remaining: 75,
    timerId: null
  };

  renderQuestion();
  tick();

  function renderQuestion() {
    const current = state.questions[state.index];
    promptEl.textContent = current.prompt;
    optionsEl.innerHTML = '';
    current.options.forEach((option, idx) => {
      const button = document.createElement('button');
      button.className = 'w-full text-left px-4 py-3 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500 transition-colors';
      button.textContent = option;
      button.addEventListener('click', () => handleAnswer(idx));
      optionsEl.appendChild(button);
    });
    scoreEl.textContent = `Score: ${state.score}`;
    barEl.style.width = `${((state.index) / state.questions.length) * 100}%`;
  }

  function handleAnswer(selectedIndex) {
    const current = state.questions[state.index];
    const correct = selectedIndex === current.answer;
    const buttons = Array.from(optionsEl.children);
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === current.answer) {
        btn.classList.add('border-emerald-500', 'text-emerald-300');
      }
      if (idx === selectedIndex && !correct) {
        btn.classList.add('border-rose-500', 'text-rose-300');
      }
    });

    if (correct) {
      state.score += 30;
      state.correct += 1;
      soundManager.play('notify');
    } else {
      state.score = Math.max(0, state.score - 10);
      soundManager.play('update');
    }

    scoreEl.textContent = `Score: ${state.score}`;

    setTimeout(() => {
      state.index += 1;
      if (state.index >= state.questions.length || state.remaining <= 0) {
        finish();
      } else {
        renderQuestion();
      }
    }, 600);
  }

  function tick() {
    state.remaining -= 1;
    timerEl.textContent = `Time left: ${state.remaining}s`;
    if (state.remaining <= 0) {
      finish();
      return;
    }
    state.timerId = setTimeout(tick, 1000);
  }

  function finish() {
    clearTimeout(state.timerId);
    optionsEl.innerHTML = '';
    const accuracy = Math.round((state.correct / state.questions.length) * 100);
    const bonus = Math.max(0, state.remaining * 2);
    const totalScore = state.score + bonus;
    const message = `You answered ${state.correct} out of ${state.questions.length} correctly. Accuracy ${accuracy}% with a time bonus of ${bonus}.`;
    onComplete({ score: totalScore, message });
  }

  function destroy() {
    clearTimeout(state.timerId);
    root.innerHTML = '';
  }

  return { destroy };
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
