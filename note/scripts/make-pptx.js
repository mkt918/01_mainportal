/**
 * make-pptx.js
 * Markdownファイルを読み込んでPPTXを生成するスクリプト
 * 使い方: node make-pptx.js <mdファイルパス>
 */

const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// ===== カラーテーマ =====
const THEME = {
  primary:   '1A3C6E', // 紺
  accent:    'E87722', // オレンジ
  light:     'EEF2F7', // 薄い青グレー
  white:     'FFFFFF',
  textDark:  '1A1A2E',
  textMid:   '444466',
  textLight: '888899',
  warning:   'E53E3E',
  correct:   '2B7A2B',
};

// ===== スライドサイズ =====
const W = 10; // インチ
const H = 5.625;

// ===== ヘルパー: FrontMatterをパース =====
function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const [k, ...v] = line.split(':');
    if (k) meta[k.trim()] = v.join(':').trim().replace(/^["']|["']$/g, '');
  }
  return { meta, body: match[2] };
}

// ===== ヘルパー: 太字マークダウンをテキスト配列に変換 =====
function parseInlineBold(text) {
  const parts = [];
  const regex = /\*\*(.*?)\*\*/g;
  let last = 0, m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ text: m[1], options: { bold: true } });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts.length ? parts : [{ text }];
}

// ===== スライドを作成するPPTXクラスのラッパー =====
class Presentation {
  constructor() {
    this.pptx = new PptxGenJS();
    this.pptx.layout = 'LAYOUT_16x9';
    this.pptx.title = '';
  }

  // 表紙スライド
  addTitleSlide(meta) {
    const slide = this.pptx.addSlide();
    // 背景グラデーション風（単色で代用）
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0, y: 0, w: W, h: H,
      fill: { color: THEME.primary },
    });
    // アクセントライン
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0, y: H - 0.15, w: W, h: 0.15,
      fill: { color: THEME.accent },
    });

    const subject = meta.subject || '授業ノート';
    const unit    = meta.unit    || '';
    const date    = meta.date    || '';
    const period  = meta.period  || '';
    const summary = meta.summary || '';

    // 科目名
    slide.addText(subject, {
      x: 0.6, y: 0.9, w: 8.8, h: 0.7,
      fontSize: 28, bold: true, color: THEME.accent, align: 'left',
    });
    // 単元名
    slide.addText(unit, {
      x: 0.6, y: 1.65, w: 8.8, h: 1.0,
      fontSize: 38, bold: true, color: THEME.white, align: 'left',
      breakLine: true,
    });
    // 要約
    if (summary) {
      slide.addText(summary, {
        x: 0.6, y: 2.9, w: 8.8, h: 0.9,
        fontSize: 14, color: 'AABBDD', align: 'left', breakLine: true,
      });
    }
    // 日付・時限
    const dateStr = [date, period].filter(Boolean).join(' | ');
    slide.addText(dateStr, {
      x: 0.6, y: H - 0.7, w: 8.8, h: 0.4,
      fontSize: 12, color: 'AABBDD', align: 'left',
    });
  }

  // セクションタイトルスライド
  addSectionSlide(title) {
    const slide = this.pptx.addSlide();
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0, y: 0, w: 0.18, h: H,
      fill: { color: THEME.accent },
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0.18, y: 0, w: W - 0.18, h: H,
      fill: { color: THEME.light },
    });
    // アイコンのラベル除去・タイトル整形
    const cleanTitle = title.replace(/^[📚📅📎✅⚠️]+\s*/, '');
    slide.addText(cleanTitle, {
      x: 1.0, y: 1.8, w: 8.0, h: 2.0,
      fontSize: 36, bold: true, color: THEME.primary, align: 'left', breakLine: true,
    });
  }

  // 通常コンテンツスライド（h3 + 箇条書き）
  addContentSlide(title, bullets) {
    const slide = this.pptx.addSlide();
    // ヘッダーバー
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0, y: 0, w: W, h: 0.85,
      fill: { color: THEME.primary },
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0, y: 0.85, w: W, h: 0.06,
      fill: { color: THEME.accent },
    });
    slide.addText(title, {
      x: 0.4, y: 0.1, w: 9.2, h: 0.65,
      fontSize: 20, bold: true, color: THEME.white, align: 'left',
    });

    // 箇条書きコンテンツ
    const maxY = H - 0.3;
    const startY = 1.1;
    const availH = maxY - startY;
    const itemH = Math.min(0.55, availH / Math.max(bullets.length, 1));
    const fontSize = Math.max(11, Math.min(16, 14 - Math.max(0, bullets.length - 5)));

    bullets.forEach((b, i) => {
      const y = startY + i * itemH;
      if (y + itemH > maxY + 0.1) return; // はみ出し防止

      const isJournal = b.match(/^\s*\(借\)|\(貸\)/);
      const isWarning = b.startsWith('⚠') || b.startsWith('注意');
      const isNote    = b.startsWith('💡') || b.startsWith('ポイント');

      if (isJournal) {
        // 仕訳エントリをコードブロック風に
        slide.addShape(this.pptx.ShapeType.rect, {
          x: 0.5, y, w: 9.0, h: itemH - 0.05,
          fill: { color: 'F0F4FA' }, line: { color: THEME.primary, width: 0.5 },
        });
        slide.addText(b.trim(), {
          x: 0.7, y: y + 0.04, w: 8.6, h: itemH - 0.1,
          fontSize: fontSize - 1, fontFace: 'Courier New', color: THEME.primary, bold: true,
        });
      } else if (isWarning) {
        slide.addShape(this.pptx.ShapeType.rect, {
          x: 0.4, y, w: 9.2, h: itemH - 0.05,
          fill: { color: 'FFF5F5' }, line: { color: THEME.warning, width: 0.5 },
        });
        slide.addText(b.trim(), {
          x: 0.6, y: y + 0.04, w: 8.8, h: itemH - 0.1,
          fontSize, color: THEME.warning, bold: true,
        });
      } else {
        // 通常箇条書き
        const parsed = parseInlineBold(b.replace(/^[-・]\s*/, '').trim());
        slide.addText([
          { text: '• ', options: { color: THEME.accent, bold: true } },
          ...parsed,
        ], {
          x: 0.5, y: y + 0.05, w: 9.0, h: itemH - 0.08,
          fontSize, color: THEME.textDark,
        });
      }
    });
  }

  // 仕訳専用スライド（表形式）
  addJournalSlide(title, entries) {
    const slide = this.pptx.addSlide();
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0, y: 0, w: W, h: 0.85,
      fill: { color: THEME.primary },
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0, y: 0.85, w: W, h: 0.06,
      fill: { color: THEME.accent },
    });
    slide.addText('仕訳例: ' + title, {
      x: 0.4, y: 0.1, w: 9.2, h: 0.65,
      fontSize: 20, bold: true, color: THEME.white,
    });

    const rowH = Math.min(0.85, (H - 1.4) / Math.max(entries.length, 1));
    entries.forEach((entry, i) => {
      const y = 1.1 + i * rowH;
      // 説明
      slide.addText(entry.desc, {
        x: 0.4, y, w: 9.2, h: 0.28, fontSize: 13, color: THEME.textMid,
      });
      // 仕訳行
      slide.addShape(this.pptx.ShapeType.rect, {
        x: 0.4, y: y + 0.28, w: 9.2, h: rowH - 0.35,
        fill: { color: 'F0F4FA' }, line: { color: THEME.primary, width: 0.8 },
      });

      const debitW  = 4.3;
      const creditW = 4.3;
      const gap     = 0.3;
      const boxY    = y + 0.3;
      const boxH    = rowH - 0.4;

      // 借方
      slide.addText('(借) ' + entry.debit, {
        x: 0.6, y: boxY, w: debitW, h: boxH,
        fontSize: 15, bold: true, color: THEME.primary, fontFace: 'メイリオ',
      });
      // スラッシュ
      slide.addText('/', {
        x: 0.4 + debitW + gap * 0.3, y: boxY, w: gap * 0.4, h: boxH,
        fontSize: 18, color: THEME.textLight, align: 'center',
      });
      // 貸方
      slide.addText('(貸) ' + entry.credit, {
        x: 0.4 + debitW + gap, y: boxY, w: creditW, h: boxH,
        fontSize: 15, bold: true, color: THEME.accent, fontFace: 'メイリオ',
      });
    });
  }

  // クイズスライド
  addQuizSlide(qNum, question, choices) {
    const slide = this.pptx.addSlide();
    // 背景
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0, y: 0, w: W, h: H,
      fill: { color: '0F2A50' },
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0, y: H - 0.12, w: W, h: 0.12,
      fill: { color: THEME.accent },
    });

    // Q番号バッジ
    slide.addShape(this.pptx.ShapeType.roundRect, {
      x: 0.4, y: 0.25, w: 0.9, h: 0.55,
      fill: { color: THEME.accent }, rectRadius: 0.1,
    });
    slide.addText(`Q${qNum}`, {
      x: 0.4, y: 0.25, w: 0.9, h: 0.55,
      fontSize: 18, bold: true, color: THEME.white, align: 'center', valign: 'middle',
    });

    // 問題文
    slide.addText(question, {
      x: 1.5, y: 0.25, w: 8.0, h: 0.65,
      fontSize: 15, bold: true, color: THEME.white, breakLine: true,
    });

    // 選択肢
    const choiceColors = ['3A7BF7', '27AE60', '9B59B6', 'E67E22'];
    const labels = ['A', 'B', 'C', 'D'];
    const startY = 1.1;
    const gap    = 0.92;

    choices.forEach((c, i) => {
      const y = startY + i * gap;
      const isCorrect = c.endsWith('✓') || c.includes('✓');
      const cleanText = c.replace('✓', '').trim().replace(/^[A-D]\)\s*/, '');
      const bg = isCorrect ? THEME.correct : choiceColors[i % choiceColors.length];

      // 丸バッジ
      slide.addShape(this.pptx.ShapeType.ellipse, {
        x: 0.4, y: y + 0.05, w: 0.55, h: 0.55,
        fill: { color: bg },
      });
      slide.addText(labels[i], {
        x: 0.4, y: y + 0.05, w: 0.55, h: 0.55,
        fontSize: 16, bold: true, color: THEME.white, align: 'center', valign: 'middle',
      });

      // 選択肢テキスト
      slide.addText(cleanText, {
        x: 1.15, y: y + 0.1, w: 8.4, h: 0.48,
        fontSize: 14, color: isCorrect ? '7FFF7F' : THEME.white,
        bold: isCorrect,
      });

      if (isCorrect) {
        slide.addText('✓ 正解', {
          x: 8.4, y: y + 0.1, w: 1.2, h: 0.48,
          fontSize: 12, bold: true, color: '7FFF7F', align: 'right',
        });
      }
    });
  }

  // まとめスライド
  addSummarySlide(unit, keyPoints) {
    const slide = this.pptx.addSlide();
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0, y: 0, w: W, h: H,
      fill: { color: THEME.primary },
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0, y: H - 0.12, w: W, h: 0.12,
      fill: { color: THEME.accent },
    });
    slide.addText('本日のまとめ', {
      x: 0.5, y: 0.25, w: 9.0, h: 0.65,
      fontSize: 26, bold: true, color: THEME.accent,
    });
    slide.addText(unit, {
      x: 0.5, y: 0.9, w: 9.0, h: 0.5,
      fontSize: 18, color: THEME.white,
    });

    const startY = 1.55;
    const rowH   = Math.min(0.65, (H - startY - 0.3) / Math.max(keyPoints.length, 1));
    keyPoints.forEach((kp, i) => {
      const y = startY + i * rowH;
      slide.addShape(this.pptx.ShapeType.rect, {
        x: 0.4, y, w: 0.08, h: rowH - 0.1,
        fill: { color: THEME.accent },
      });
      const parsed = parseInlineBold(kp);
      slide.addText(parsed, {
        x: 0.65, y: y + 0.05, w: 8.9, h: rowH - 0.12,
        fontSize: 14, color: THEME.white,
      });
    });
  }

  async save(outputPath) {
    await this.pptx.writeFile({ fileName: outputPath });
    console.log('保存しました:', outputPath);
  }
}

// ===== メイン処理 =====
async function main() {
  const mdPath = process.argv[2];
  if (!mdPath) {
    console.error('使い方: node make-pptx.js <mdファイルパス>');
    process.exit(1);
  }

  const content = fs.readFileSync(mdPath, 'utf8');
  const { meta, body } = parseFrontMatter(content);
  const pres = new Presentation();
  pres.pptx.title = `${meta.subject || ''}　${meta.unit || ''}`;

  // 1. 表紙
  pres.addTitleSlide(meta);

  // ===== Bodyをパース =====
  const lines = body.split('\n');
  let i = 0;

  // セクション・h3・箇条書きを走査
  let currentSection = '';
  let currentH3 = '';
  let currentBullets = [];
  let journalEntries = [];
  let inJournalBlock = false;

  // クイズセクションかどうか
  let inQuiz = false;
  let quizNum = 0;
  let quizQuestion = '';
  let quizChoices = [];

  // まとめ用ポイント収集
  const summaryPoints = [];

  function flushContent() {
    if (inJournalBlock && journalEntries.length > 0) {
      pres.addJournalSlide(currentH3, journalEntries);
      journalEntries = [];
      inJournalBlock = false;
    } else if (currentH3 && currentBullets.length > 0) {
      pres.addContentSlide(currentH3, currentBullets);
    }
    currentBullets = [];
    inJournalBlock = false;
  }

  function flushQuiz() {
    if (quizQuestion && quizChoices.length > 0) {
      pres.addQuizSlide(quizNum, quizQuestion, quizChoices);
    }
    quizQuestion = '';
    quizChoices = [];
  }

  while (i < lines.length) {
    const line = lines[i];

    // h2 セクション
    if (line.startsWith('## ')) {
      flushContent();
      if (inQuiz) { flushQuiz(); inQuiz = false; }
      currentSection = line.replace(/^##\s*/, '');
      currentH3 = '';
      // クイズセクション判定
      if (currentSection.includes('クイズ') || currentSection.includes('復習')) {
        inQuiz = true;
        quizNum = 0;
      } else {
        inQuiz = false;
        pres.addSectionSlide(currentSection);
      }
      i++; continue;
    }

    // h3
    if (line.startsWith('### ')) {
      flushContent();
      if (inQuiz) { flushQuiz(); }
      currentH3 = line.replace(/^###\s*/, '').replace(/^[📚📅📎✅⚠️]+\s*/, '');
      currentBullets = [];
      journalEntries = [];
      i++; continue;
    }

    // h4 （仕訳の見出し）
    if (line.startsWith('#### ')) {
      flushContent();
      currentH3 = line.replace(/^####\s*/, '');
      currentBullets = [];
      journalEntries = [];
      i++; continue;
    }

    // クイズモード: 問題文
    if (inQuiz && line.startsWith('**Q')) {
      flushQuiz();
      quizNum++;
      quizQuestion = line.replace(/^\*\*Q\d+\*\*:\s*/, '').replace(/\*\*/g, '');
      quizChoices = [];
      i++; continue;
    }

    // クイズモード: 選択肢
    if (inQuiz && line.match(/^-\s+[A-C]\)/)) {
      quizChoices.push(line.replace(/^-\s+/, ''));
      i++; continue;
    }

    // 仕訳行（(借) or (貸) を含む）
    if (line.includes('(借)') && line.includes('(貸)')) {
      inJournalBlock = true;
      // 前の説明文を取得
      const descLine = currentBullets.length > 0 ? currentBullets[currentBullets.length - 1] : '';
      const m = line.match(/\(借\)\s*(.+?)\s*\/\s*\(貸\)\s*(.+)/);
      if (m) {
        journalEntries.push({ desc: descLine, debit: m[1].trim(), credit: m[2].trim() });
      } else {
        const m2 = line.match(/\(借\)\s+(.+?)\s+\d+\s*\/\s*\(貸\)\s+(.+?)\s+\d+/);
        if (m2) {
          journalEntries.push({ desc: descLine, debit: m2[1].trim(), credit: m2[2].trim() });
        }
      }
      i++; continue;
    }

    // 仕訳の別形式: "- (借) **当座預金** 100 / (貸) 現金 100"
    if (line.match(/\(借\).*\/.*\(貸\)/)) {
      inJournalBlock = true;
      const desc = currentBullets.length > 0 ? currentBullets[currentBullets.length - 1].replace(/^[-・]\s*/, '') : '';
      const cleaned = line.replace(/\*\*/g, '').replace(/^[-\s]*/, '');
      const m = cleaned.match(/\(借\)\s+(.+?)\s+[\d,]+\s*\/\s*\(貸\)\s+(.+?)\s+[\d,]+/);
      if (m) {
        journalEntries.push({ desc, debit: m[1].trim(), credit: m[2].trim() });
      } else {
        currentBullets.push(line.replace(/^[-\s]*/, '').trim());
      }
      i++; continue;
    }

    // WARNING / NOTE ブロック
    if (line.startsWith('> [!WARNING]') || line.startsWith('> [!NOTE]')) {
      const isWarn = line.includes('WARNING');
      const notes = [];
      i++;
      while (i < lines.length && lines[i].startsWith('> ')) {
        notes.push(lines[i].replace(/^>\s*/, ''));
        i++;
      }
      if (isWarn && notes.length > 0) {
        currentBullets.push('⚠ ' + notes.join(' '));
      }
      continue;
    }

    // 通常の箇条書き
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const text = line.replace(/^[-*]\s+/, '').trim();
      if (!inQuiz) currentBullets.push(text);
      i++; continue;
    }

    // 段落テキスト（空白以外）
    if (line.trim() && !line.startsWith('#') && !line.startsWith('---') && !line.startsWith('>')) {
      const clean = line.trim();
      if (!inQuiz && clean.length > 3) {
        currentBullets.push(clean);
      }
    }

    i++;
  }

  // 残りをフラッシュ
  flushContent();
  if (inQuiz) flushQuiz();

  // まとめスライド
  const keyPoints = [
    '**当座預金**とは、小切手を使って決済できる銀行口座（利息なし）',
    '入金・預け入れ → 借方（左側）に「当座預金」を記入',
    '小切手振り出し → 貸方（右側）に「当座預金」を記入',
    '受け取った小切手をただちに預け入れた → 借方「当座預金」',
    '**当座借越**: 残高ゼロでも引き落とし可能（決算時は負債）',
  ];
  pres.addSummarySlide(meta.unit || '', keyPoints);

  // 出力先
  const outDir  = path.dirname(mdPath);
  const baseName = path.basename(mdPath, '.md');
  const outPath = path.join(outDir, baseName + '.pptx');
  await pres.save(outPath);
}

main().catch(e => { console.error(e); process.exit(1); });
