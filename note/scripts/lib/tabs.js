const { REGEX } = require('./config');
const { convertMaterialsToAccordion } = require('./materials');

/**
 * HTMLコンテンツをタブ形式に変換
 */
function convertToTabStructure(htmlContent) {
    const sections = [];

    // 前回の復習
    const reviewMatch = htmlContent.match(REGEX.review);
    let reviewText = reviewMatch ? reviewMatch[1] : '';

    // 復習セクションからクイズ部分を分離
    const reviewQuizzes = reviewText.match(REGEX.quizExtract) || [];
    let reviewContentText = reviewText
        .replace(REGEX.quizExtract, '')
        .split(/<h2/)[0]
        .replace(REGEX.reviewQuizHeading, '')
        .trim();

    // 本日の内容
    const scheduleMatch = htmlContent.match(REGEX.schedule);
    const scheduleContentText = scheduleMatch ? scheduleMatch[1].trim() : '';

    // 資料セクション
    const materialsMatch = htmlContent.match(REGEX.materialSection);
    let materialsText = materialsMatch ? materialsMatch[1].trim() : '';
    let materialsContentText = materialsText
        ? convertMaterialsToAccordion(`<h2>📎 資料</h2>\n${materialsText}`)
        : '';

    // まとめクイズ
    const summaryMatch = htmlContent.match(REGEX.summary);
    const summaryText = summaryMatch ? summaryMatch[1] : '';
    const summaryQuizzes = summaryText.match(REGEX.quizExtract) || [];

    // Tab 1: 復習クイズ
    if (reviewQuizzes.length > 0) {
        sections.push(createQuizTab('review', '📝 復習クイズ', reviewQuizzes));
    }

    // Tab 2: 本日の内容
    if (reviewContentText || scheduleContentText || materialsContentText) {
        sections.push({
            id: 'schedule',
            title: '📅 本日の内容',
            content: buildScheduleContent(reviewContentText, scheduleContentText, materialsContentText)
        });
    }

    // Tab 3: まとめクイズ
    if (summaryQuizzes.length > 0) {
        sections.push(createQuizTab('summary', '📋 まとめクイズ', summaryQuizzes));
    }

    // Tab 4: リアクションシート
    sections.push({
        id: 'reaction-sheet',
        title: '📝 リアクションシート',
        content: getReactionSheetHTML()
    });

    if (sections.length === 0) return htmlContent;

    // HTMLの生成
    const tabButtons = sections.map(s =>
        `<button class="tab-button" data-tab="${s.id}" onclick="switchTab('${s.id}')">${s.title}</button>`
    ).join('');

    const tabContents = sections.map(s =>
        `<div id="${s.id}" class="tab-content ${s.isQuiz ? 'tab-quiz-content' : ''}">${s.content}</div>`
    ).join('');

    // 元のコンテンツから抽出したセクションを削除
    let remainingContent = htmlContent;
    if (reviewMatch) remainingContent = remainingContent.replace(reviewMatch[0], '');
    if (scheduleMatch) remainingContent = remainingContent.replace(scheduleMatch[0], '');
    if (summaryMatch) remainingContent = remainingContent.replace(summaryMatch[0], '');
    if (materialsMatch) remainingContent = remainingContent.replace(materialsMatch[0], '');
    remainingContent = remainingContent.replace(REGEX.quizExtract, '');

    return `
<div class="tab-container">
    <div class="tab-nav">${tabButtons}</div>
    ${tabContents}
</div>
${remainingContent.trim()}`;
}

/**
 * クイズタブを生成
 */
function createQuizTab(carouselId, title, quizzes) {
    const carouselItems = quizzes.map((quizHTML, index) =>
        `<div class="carousel-item ${index === 0 ? 'active' : ''}">${quizHTML}</div>`
    ).join('');

    const nav = quizzes.length > 1 ? `
                    <div class="carousel-nav">
                        <button class="carousel-btn prev" onclick="navigateCarousel('${carouselId}', -1)"><span class="material-symbols-outlined">chevron_left</span></button>
                        <span class="carousel-indicator"><span class="current-slide">1</span> / ${quizzes.length}</span>
                        <button class="carousel-btn next" onclick="navigateCarousel('${carouselId}', 1)"><span class="material-symbols-outlined">chevron_right</span></button>
                    </div>` : '';

    return {
        id: `${carouselId}-quizzes`,
        title,
        isQuiz: true,
        content: `
                <div class="quiz-carousel" data-carousel="${carouselId}">
                    <div class="carousel-container">${carouselItems}</div>
                    ${nav}
                </div>`
    };
}

/**
 * 本日の内容セクションを構築
 */
function buildScheduleContent(reviewContentText, scheduleContentText, materialsContentText) {
    let content = '';

    if (reviewContentText) {
        content += `<div class="mb-8"><h3 class="text-xl font-bold mb-4 text-indigo-600 flex items-center gap-2"><span class="material-symbols-outlined">history</span>前回のおさらい</h3><div class="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">${reviewContentText}</div></div>`;
    }

    if (scheduleContentText) {
        const styledSchedule = styleScheduleContent(scheduleContentText);
        content += `<div class="schedule-content">${styledSchedule}</div>`;
    }

    if (materialsContentText) {
        content += `<div class="mb-4">${materialsContentText}</div>`;
    }

    return content;
}

/**
 * 本日の内容のHTMLにスタイルを適用
 */
function styleScheduleContent(html) {
    let result = html
        // h3をカード形式の見出しに変換
        .replace(/<h3>([^<]+)<\/h3>/g, `
            <div class="schedule-section mb-6">
                <h3 class="text-lg font-bold mb-3 pb-2 border-b-2 border-indigo-200 text-indigo-700 flex items-center gap-2">
                    <span class="material-symbols-outlined text-indigo-500">chevron_right</span>
                    $1
                </h3>
            </div>`)
        // 箇条書きリストをカードスタイルに
        .replace(/<ul>/g, '<ul class="space-y-3 mb-6">')
        // strong付き箇条書き（li全体を置換）
        .replace(/<li><strong>([^<]+)<\/strong>([\s\S]*?)<\/li>/g,
            `<li class="flex items-start gap-3 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 shadow-sm">
                <span class="material-symbols-outlined text-indigo-500 mt-0.5 flex-shrink-0">label_important</span>
                <div><span class="font-bold text-indigo-700">$1</span><span class="text-slate-600">$2</span></div>
            </li>`)
        // 段落にクラスを追加
        .replace(/<p>/g, '<p class="text-slate-700 leading-relaxed mb-4">');

    // 閉じていないschedule-sectionを閉じる
    result = result.replace(/(<div class="schedule-section mb-6">[\s\S]*?)(?=<div class="schedule-section mb-6">|$)/g, (match) => {
        if (!match.includes('</div>\n            </div>')) {
            return match.replace(/<\/h3>\s*<\/div>/, '</h3>') + '</div>';
        }
        return match;
    });

    return result;
}

/**
 * リアクションシートHTMLを取得
 */
function getReactionSheetHTML() {
    return `
            <div class="section-card">
                <h3 class="text-xl font-bold mb-6 text-indigo-600 flex items-center gap-2">
                    <span class="material-symbols-outlined">send</span>
                    リアクションシート
                </h3>
                <form id="reactionForm" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-2">4桁番号（半角数字）</label>
                            <input type="text" id="userNumber" name="number" required pattern="\\d{4}" maxlength="4"
                                class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-colors"
                                placeholder="例: 1234">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-2">授業名</label>
                            <input type="text" id="lessonTitle" name="lesson" readonly
                                class="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-500 outline-none">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">まとめ・感想</label>
                        <textarea id="summary" name="summary" required rows="4"
                            class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-colors"
                            placeholder="今日学んだこと、印象に残ったこと"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">わからなかったところ</label>
                        <textarea id="questions" name="questions" rows="3"
                            class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-colors"
                            placeholder="疑問点やもっと詳しく知りたいことがあれば記入してください"></textarea>
                    </div>
                    <div class="flex flex-col gap-4">
                        <input type="hidden" id="timestamp" name="timestamp">
                        <button type="submit" id="submitBtn" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50">
                            この内容で送信する
                        </button>
                        <div id="formStatus" class="hidden text-center p-3 rounded-lg font-medium"></div>
                    </div>
                </form>

                <div class="mt-12 pt-8 border-t border-slate-100">
                    <h4 class="text-sm font-bold text-slate-500 mb-4 flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">history</span>
                        送信履歴（ローカル保存）
                    </h4>
                    <div id="submissionHistory" class="space-y-4">
                    </div>
                </div>
            </div>
        `;
}

module.exports = {
    convertToTabStructure
};
