// クイズ管理
const quizState = {};

function selectAnswer(questionId, optionElement) {
    const questionDiv = optionElement.closest('.quiz-question');
    questionDiv.querySelectorAll('.quiz-option').forEach(opt => {
        opt.classList.remove('selected');
    });

    optionElement.classList.add('selected');
    quizState[questionId] = optionElement;

    const checkBtn = questionDiv.querySelector('.check-answer-btn');
    if (checkBtn) checkBtn.disabled = false;
}

function checkAnswer(questionId) {
    const selectedOption = quizState[questionId];
    if (!selectedOption) return;

    const questionDiv = selectedOption.closest('.quiz-question');
    const isCorrect = selectedOption.dataset.correct === 'true';
    const feedback = questionDiv.querySelector('.quiz-feedback');
    const checkBtn = questionDiv.querySelector('.check-answer-btn');

    questionDiv.querySelectorAll('.quiz-option').forEach(opt => {
        opt.classList.add('disabled');
        if (opt.dataset.correct === 'true') {
            opt.classList.add('correct');
        }
    });

    feedback.classList.add('show');
    if (isCorrect) {
        selectedOption.classList.add('correct');
        feedback.classList.add('correct');
        feedback.innerHTML = '<span class="material-symbols-outlined" style="vertical-align: middle;">check_circle</span> 正解です！よくできました。';
    } else {
        selectedOption.classList.add('incorrect');
        feedback.classList.add('incorrect');
        feedback.innerHTML = '<span class="material-symbols-outlined" style="vertical-align: middle;">cancel</span> 不正解です。正解を確認してください。';
    }

    if (checkBtn) checkBtn.style.display = 'none';
}

function checkAnswerImmediately(questionId, optionElement) {
    const questionDiv = optionElement.closest('.quiz-question');

    if (questionDiv.classList.contains('answered')) return;

    const isCorrect = optionElement.dataset.correct === 'true';
    const feedback = questionDiv.querySelector('.quiz-feedback');

    questionDiv.classList.add('answered');

    questionDiv.querySelectorAll('.quiz-option').forEach(opt => {
        opt.classList.add('disabled');
        if (opt.dataset.correct === 'true') {
            opt.classList.add('correct');
        }
    });

    feedback.classList.add('show');
    if (isCorrect) {
        optionElement.classList.add('correct');
        feedback.classList.add('correct');
        feedback.innerHTML = '<span class="material-symbols-outlined" style="vertical-align: middle;">check_circle</span> 正解です！よくできました。';
    } else {
        optionElement.classList.add('incorrect');
        feedback.classList.add('incorrect');
        feedback.innerHTML = '<span class="material-symbols-outlined" style="vertical-align: middle;">cancel</span> 不正解です。正解を確認してください。';
    }
}

function navigateCarousel(carouselId, direction) {
    const carousel = document.querySelector('[data-carousel="' + carouselId + '"]');
    if (!carousel) return;

    const items = carousel.querySelectorAll('.carousel-item');
    const currentIndex = Array.from(items).findIndex(item => item.classList.contains('active'));
    const newIndex = currentIndex + direction;

    if (newIndex < 0 || newIndex >= items.length) return;

    items[currentIndex].classList.remove('active');
    items[newIndex].classList.add('active');

    const indicator = carousel.querySelector('.current-slide');
    if (indicator) {
        indicator.textContent = newIndex + 1;
    }

    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');
    if (prevBtn) prevBtn.disabled = newIndex === 0;
    if (nextBtn) nextBtn.disabled = newIndex === items.length - 1;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const selectedButton = document.querySelector('[data-tab="' + tabId + '"]');
    const selectedContent = document.getElementById(tabId);

    if (selectedButton) selectedButton.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');

    if (tabId === 'reaction-sheet') {
        document.getElementById('lessonTitle').value = document.title;
        loadSubmissionHistory();
    }
}

const GAS_URL = '{{GAS_URL}}';

document.getElementById('reactionForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const status = document.getElementById('formStatus');

    const now = new Date();
    const timestamp = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');

    const timestampInput = e.target.querySelector('#timestamp');
    if (timestampInput) timestampInput.value = timestamp;

    const finalFormData = new FormData(e.target);

    const data = {
        number: finalFormData.get('number'),
        lesson: finalFormData.get('lesson'),
        summary: finalFormData.get('summary'),
        questions: finalFormData.get('questions'),
        timestamp: timestamp
    };

    saveSubmissionLocal(data);

    btn.disabled = true;
    status.className = 'text-center p-3 rounded-lg font-medium bg-blue-50 text-blue-600 block';
    status.textContent = '送信中...';

    try {
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: new URLSearchParams(finalFormData)
        });

        status.className = 'text-center p-3 rounded-lg font-medium bg-green-50 text-green-600 block';
        status.textContent = '送信が完了しました！履歴にも保存されています。';
        e.target.reset();
        loadSubmissionHistory();
    } catch (err) {
        status.className = 'text-center p-3 rounded-lg font-medium bg-red-50 text-red-600 block';
        status.textContent = '送信中にエラーが発生しました。';
    } finally {
        btn.disabled = false;
    }
});

document.getElementById('userNumber')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

function saveSubmissionLocal(data) {
    let history = JSON.parse(localStorage.getItem('lesson_submissions') || '[]');
    history.unshift(data);
    localStorage.setItem('lesson_submissions', JSON.stringify(history.slice(0, 10)));
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function loadSubmissionHistory() {
    const container = document.getElementById('submissionHistory');
    if (!container) return;

    const history = JSON.parse(localStorage.getItem('lesson_submissions') || '[]');
    if (history.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm italic">履歴はありません。</p>';
        return;
    }

    container.innerHTML = history.map(item =>
        '<div class="history-card">' +
        '<div class="history-date">' + escapeHtml(item.timestamp) + '</div>' +
        '<div class="font-bold text-indigo-600 mb-1">' + escapeHtml(item.lesson) + '</div>' +
        '<div class="text-slate-700 whitespace-pre-wrap"><span class="font-bold">まとめ:</span> ' + escapeHtml(item.summary) + '</div>' +
        (item.questions ? '<div class="text-slate-600 mt-2 text-sm italic"><span class="font-bold">？:</span> ' + escapeHtml(item.questions) + '</div>' : '') +
        '</div>'
    ).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const firstTab = document.querySelector('.tab-button');
    if (firstTab) {
        const tabId = firstTab.dataset.tab;
        switchTab(tabId);
    }

    document.querySelectorAll('.quiz-carousel').forEach(carousel => {
        const prevBtn = carousel.querySelector('.carousel-btn.prev');
        if (prevBtn) prevBtn.disabled = true;
    });
});

function toggleAccordion(element) {
    const content = element.nextElementSibling;
    const isOpen = element.classList.contains('active');

    if (isOpen) {
        element.classList.remove('active');
        content.classList.remove('open');
    } else {
        element.classList.add('active');
        content.classList.add('open');
    }
}

/**
 * PDFなどを別タブ（全画面）で開く
 */
function openFullscreen(url) {
    window.open(url, '_blank');
}
