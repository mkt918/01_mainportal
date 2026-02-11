const { REGEX } = require('./config');

/**
 * クイズをインタラクティブなHTMLに変換
 */
function convertQuizToHTML(markdown) {
    let quizCounter = 0;

    return markdown.replace(REGEX.quiz, (match, qNum, question, options) => {
        const questionId = `quiz-${quizCounter++}`;
        const optionLines = options.trim().split(/[\r\n]+/).filter(line => line.trim());

        const optionsHTML = optionLines.map((line) => {
            const isCorrect = line.includes('\u2713');
            const cleanLine = line.replace('\u2713', '').trim();
            const letterMatch = cleanLine.match(/- ([A-C])\)/);
            if (!letterMatch) return '';

            const letter = letterMatch[1];
            const text = cleanLine.replace(/- [A-C]\)\s*/, '');

            return `<div class="quiz-option" data-correct="${isCorrect}" onclick="checkAnswerImmediately('${questionId}', this)"><span class="option-letter">${letter}</span><span class="option-text">${text}</span></div>`;
        }).join('');

        return `\n\n<div class="quiz-question section-card" data-quiz-id="${questionId}"><p class="question-text text-lg font-semibold mb-4"><strong>Q${qNum}</strong>: ${question}</p><div class="quiz-options">${optionsHTML}</div><div class="quiz-feedback"></div></div>\n\n`;
    });
}

module.exports = {
    convertQuizToHTML
};
