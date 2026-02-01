/**
 * HTMLコンテンツをタブ形式に変換
 */
function convertToTabStructure(htmlContent) {
    // セクションを抽出
    const sections = [];

    // 前回の復習セクション
    const reviewMatch = htmlContent.match(/<h2>📚 前回の復習<\/h2>([\s\S]*?)(?=<h2>|<div class="section-card">|$)/);
    if (reviewMatch) {
        sections.push({
            id: 'review',
            title: '📚 前回の復習',
            content: reviewMatch[1]
        });
    }

    // 本日の予定セクション
    const scheduleMatch = htmlContent.match(/<h2>📅 本日の予定<\/h2>([\s\S]*?)(?=<h2>|<div class="section-card">|$)/);
    if (scheduleMatch) {
        sections.push({
            id: 'schedule',
            title: '📅 本日の予定',
            content: scheduleMatch[1]
        });
    }

    // クイズを抽出
    const quizRegex = /<div class="quiz-question section-card">[\s\S]*?<strong>Q(\d+)<\/strong>:[\s\S]*?<\/div><\/div>/g;
    let quizMatch;
    let quizIndex = 0;

    while ((quizMatch = quizRegex.exec(htmlContent)) !== null) {
        const qNum = quizMatch[1];
        sections.push({
            id: `quiz-${quizIndex}`,
            title: `Q${qNum}`,
            content: quizMatch[0],
            isQuiz: true
        });
        quizIndex++;
    }

    // タブHTMLを生成
    if (sections.length === 0) return htmlContent;

    const tabButtons = sections.map(section =>
        `<button class="tab-button" data-tab="${section.id}" onclick="switchTab('${section.id}')">${section.title}</button>`
    ).join('');

    const tabContents = sections.map(section =>
        `<div id="${section.id}" class="tab-content ${section.isQuiz ? 'tab-quiz-content' : ''}">${section.content}</div>`
    ).join('');

    return `
        <div class="tab-container">
            <div class="tab-nav">
                ${tabButtons}
            </div>
            ${tabContents}
        </div>
    `;
}

module.exports = { convertToTabStructure };
