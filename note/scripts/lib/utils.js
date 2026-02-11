/**
 * 日付をyyyy-mm-dd形式にフォーマット
 */
function formatDate(date) {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.getFullYear() + '-' +
        String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
        String(dateObj.getDate()).padStart(2, '0');
}

/**
 * XSS対策: HTMLエスケープ
 */
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * 時限の「限」重複を防止
 */
function formatPeriod(period) {
    return period.toString().includes('限') ? period : `${period}限`;
}

/**
 * markedが変換できなかった**を<strong>に変換
 * 日本語テキストでmarkedが失敗するケースの補完
 */
function fixUnconvertedMarkdown(html) {
    return html
        // **text** → <strong>text</strong>
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

module.exports = {
    formatDate,
    escapeHtml,
    formatPeriod,
    fixUnconvertedMarkdown
};
