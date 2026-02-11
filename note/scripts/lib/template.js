const fs = require('fs');
const path = require('path');
const { TEMPLATES_DIR, GAS_URL } = require('./config');
const { formatDate, escapeHtml, formatPeriod } = require('./utils');

let cachedStyles = null;
let cachedScripts = null;
let cachedPageTemplate = null;

/**
 * テンプレートファイルを読み込む（キャッシュ付き）
 */
function loadTemplates() {
    if (!cachedStyles) {
        cachedStyles = fs.readFileSync(path.join(TEMPLATES_DIR, 'styles.css'), 'utf-8');
    }
    if (!cachedScripts) {
        cachedScripts = fs.readFileSync(path.join(TEMPLATES_DIR, 'scripts.js'), 'utf-8')
            .replace('{{GAS_URL}}', GAS_URL);
    }
    if (!cachedPageTemplate) {
        cachedPageTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'page.html'), 'utf-8');
    }

    return { styles: cachedStyles, scripts: cachedScripts, pageTemplate: cachedPageTemplate };
}

/**
 * HTMLテンプレートを生成
 */
function generateHTML(data, htmlContent) {
    const { styles, scripts, pageTemplate } = loadTemplates();

    const formattedDate = formatDate(data.date);
    const periodText = formatPeriod(data.period);

    const escapedSubject = escapeHtml(data.subject);
    const escapedUnit = escapeHtml(data.unit);
    const escapedPeriodText = escapeHtml(periodText);
    const escapedFormattedDate = escapeHtml(formattedDate);

    return pageTemplate
        .replace(/\{\{SUBJECT\}\}/g, escapedSubject)
        .replace(/\{\{UNIT\}\}/g, escapedUnit)
        .replace(/\{\{DATE\}\}/g, escapedFormattedDate)
        .replace(/\{\{PERIOD\}\}/g, escapedPeriodText)
        .replace('{{STYLES}}', styles)
        .replace('{{SCRIPTS}}', scripts)
        .replace('{{CONTENT}}', htmlContent);
}

/**
 * キャッシュをクリア（テスト用）
 */
function clearCache() {
    cachedStyles = null;
    cachedScripts = null;
    cachedPageTemplate = null;
}

module.exports = {
    generateHTML,
    clearCache
};
