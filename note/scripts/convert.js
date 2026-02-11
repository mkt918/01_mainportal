const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const { LESSONS_DIR, OUTPUT_DIR, LESSONS_JSON } = require('./lib/config');
const { formatDate, formatPeriod, fixUnconvertedMarkdown } = require('./lib/utils');
const { parseMarkdownFile } = require('./lib/parser');
const { convertQuizToHTML } = require('./lib/quiz');
const { convertToTabStructure } = require('./lib/tabs');
const { generateHTML } = require('./lib/template');

/**
 * Markdown授業記録をHTMLに変換し、lessons.jsonを更新するスクリプト
 */
function main() {
    console.log('📚 授業記録の変換を開始します...\n');

    const files = fs.readdirSync(LESSONS_DIR)
        .filter(f => f.endsWith('.md') && f !== 'template.md' && f !== 'README.md');

    const lessonsData = [];

    files.forEach(file => {
        const filePath = path.join(LESSONS_DIR, file);
        console.log(`処理中: ${file}`);

        try {
            const { frontmatter, markdown, filename } = parseMarkdownFile(filePath);

            // クイズを変換
            const quizHTML = convertQuizToHTML(markdown);

            // MarkdownをHTMLに変換
            let htmlContent = marked(quizHTML);

            // markedが変換できなかった**を補完
            htmlContent = fixUnconvertedMarkdown(htmlContent);

            // タブ形式に変換
            htmlContent = convertToTabStructure(htmlContent);

            // 完全なHTMLを生成
            const fullHTML = generateHTML(frontmatter, htmlContent);

            // 出力ディレクトリを作成
            const outputDir = path.join(OUTPUT_DIR, filename);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // HTMLファイルを保存
            const outputPath = path.join(outputDir, 'index.html');
            fs.writeFileSync(outputPath, fullHTML, 'utf-8');

            // lessons.json用のデータを追加
            const periodText = formatPeriod(frontmatter.period);
            const formattedDate = formatDate(frontmatter.date);

            lessonsData.push({
                id: lessonsData.length + 1,
                date: formattedDate,
                unit: frontmatter.unit,
                title: `${frontmatter.subject}（${periodText}）`,
                summary: frontmatter.summary || `${frontmatter.unit}について学習しました。`,
                tags: frontmatter.tags || [frontmatter.subject, periodText],
                readTime: frontmatter.readTime || '10分',
                url: `note/${filename}/index.html`
            });

            console.log(`  ✓ 生成完了: ${outputPath}`);
        } catch (error) {
            console.error(`  ✗ エラー: ${file}`, error.message);
        }
    });

    // lessons.jsonを更新
    lessonsData.sort((a, b) => new Date(b.date) - new Date(a.date));
    fs.writeFileSync(LESSONS_JSON, JSON.stringify(lessonsData, null, 2), 'utf-8');
    console.log(`\n✓ lessons.jsonを更新しました (${lessonsData.length}件)`);

    console.log('\n🎉 変換が完了しました！');
}

main();
