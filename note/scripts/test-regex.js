const fs = require('fs');
const path = require('path');

// テスト用のMarkdownテキスト
const testMarkdown = `**Q1**: プログラミングとは何ですか？

- A) コンピュータに命令を書くこと ✓
- B) パソコンを修理すること
- C) インターネットを使うこと

**Q2**: プログラムを実行するとどうなりますか？

- A) コンピュータが命令通りに動く ✓
- B) 画面が消える
- C) 何も起こらない`;

// 現在の正規表現
const quizRegex = /\*\*Q(\d+)\*\*:\s*(.+?)\n\s*\n((?:- [A-C]\).+?\n)+)/gm;

console.log('=== Testing Quiz Regex ===\n');
console.log('Markdown:');
console.log(testMarkdown);
console.log('\n--- Matches ---');

let match;
let matchCount = 0;
while ((match = quizRegex.exec(testMarkdown)) !== null) {
    matchCount++;
    console.log(`\nMatch ${matchCount}:`);
    console.log('Full match:', match[0]);
    console.log('Q number:', match[1]);
    console.log('Question:', match[2]);
    console.log('Options:', match[3]);
}

if (matchCount === 0) {
    console.log('NO MATCHES FOUND!');
    console.log('\nTrying alternative patterns...\n');

    // パターン1: より柔軟な空白
    const regex1 = /\*\*Q(\d+)\*\*:\s*(.+?)\s*\n\s*\n((?:- [A-C]\).+?\s*\n)+)/gm;
    console.log('Pattern 1 (flexible whitespace):');
    const matches1 = testMarkdown.match(regex1);
    console.log(matches1 ? `Found ${matches1.length} matches` : 'No matches');

    // パターン2: 改行コードを考慮
    const regex2 = /\*\*Q(\d+)\*\*:\s*(.+?)[\r\n]+[\r\n]+((?:- [A-C]\).+?[\r\n]+)+)/gm;
    console.log('\nPattern 2 (with \\r\\n):');
    const matches2 = testMarkdown.match(regex2);
    console.log(matches2 ? `Found ${matches2.length} matches` : 'No matches');
}

console.log(`\n=== Total matches: ${matchCount} ===`);
