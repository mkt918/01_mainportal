const path = require('path');

const SCRIPTS_DIR = __dirname;
const LESSONS_DIR = path.join(SCRIPTS_DIR, '../../lessons');
const OUTPUT_DIR = path.join(SCRIPTS_DIR, '../../../note');
const DATA_DIR = path.join(SCRIPTS_DIR, '../../../data');
const TEMPLATES_DIR = path.join(SCRIPTS_DIR, '../templates');
const LESSONS_JSON = path.join(DATA_DIR, 'lessons.json');

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwK_kN6pEX0yKueKISvFptwGvWZ1bKiWcIityL_XA2AlayPgj131bQdJlN4XitGD950dA/exec';

const REGEX = {
    quiz: /\*\*Q(\d+)\*\*:\s*(.+?)[\r\n]+[\r\n]+((?:- [A-C]\).+?[\r\n]+)+)/gm,
    quizExtract: /<div class="quiz-question section-card"[^>]*>[\s\S]*?<div class="quiz-feedback"><\/div><\/div>/g,
    materials: /<h2>📎 資料<\/h2>\s*<ul>([\s\S]*?)<\/ul>/g,
    materialLink: /<li><a href="([^"]+)">([^<]+)<\/a><\/li>/g,
    review: /<h2[^>]*>[^<]*?前回の復習<\/h2>([\s\S]*?)(?=<h2|$)/,
    schedule: /<h2[^>]*>[^<]*?(?:本日の予定|本日の内容)<\/h2>([\s\S]*?)(?=<h2|$)/,
    materialSection: /<h2[^>]*>[^<]*?資料<\/h2>([\s\S]*?)(?=<h2|$)/,
    summary: /<h2[^>]*>[^<]*?まとめクイズ<\/h2>([\s\S]*?)(?=<h2|$)/,
    reviewQuizHeading: /<h3[^>]*>[^<]*?復習クイズ<\/h3>/g
};

module.exports = {
    SCRIPTS_DIR,
    LESSONS_DIR,
    OUTPUT_DIR,
    DATA_DIR,
    TEMPLATES_DIR,
    LESSONS_JSON,
    GAS_URL,
    REGEX
};
