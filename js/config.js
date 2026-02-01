/**
 * サイト設定（ライトモード対応版）
 * 将来の拡張や設定変更を容易にするための定数定義
 */
const CONFIG = {
    // データファイルのパス
    dataPaths: {
        lessons: './data/lessons.json',
        tools: './data/tools.json',
        trivia: './data/trivia.csv'
    },

    // 現在表示する雑学のテーマ ('動物', '宇宙', '科学', '歴史', '食べ物', '生活', 'IT' など)
    activeTriviaTheme: '動物',

    // DOM要素のセレクタ
    selectors: {
        lessonsContainer: 'lessons-container',
        toolsContainer: 'tools-container',
        tagFilters: 'tag-filters',
        searchInput: 'lesson-search'
    },

    // CSSクラス（Tailwind - ライトモード）
    classes: {
        filterActive: ['active', 'bg-primary/10', 'text-primary', 'border-primary'],
        filterInactive: ['text-slate-500', 'border-slate-200', 'bg-white']
    },

    // UI文言
    labels: {
        allFilter: 'すべて',
        viewMaterial: '資料を見る',
        useTool: '使ってみる'
    }
};

// ES Modules 対応（将来的なビルドツール導入を見据えて）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
