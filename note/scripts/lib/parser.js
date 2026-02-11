const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

/**
 * Markdownファイルを読み込んでパース
 */
function parseMarkdownFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: markdown } = matter(content);

    return {
        frontmatter: data,
        markdown: markdown,
        filename: path.basename(filePath, '.md')
    };
}

module.exports = {
    parseMarkdownFile
};
