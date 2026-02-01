/**
 * クラスポータル - メインアプリケーション
 * 
 * 依存関係:
 * - config.js (設定定数)
 * - templates.js (HTMLテンプレート)
 */
document.addEventListener('DOMContentLoaded', () => {
    // ========================================
    // State (状態管理)
    // ========================================
    const state = {
        allLessons: [],
        allTools: [],
        activeFilter: 'all'
    };

    // ========================================
    // DOM Elements (DOM要素キャッシュ)
    // ========================================
    const elements = {
        lessonsContainer: document.getElementById(CONFIG.selectors.lessonsContainer),
        toolsContainer: document.getElementById(CONFIG.selectors.toolsContainer),
        tagFilterContainer: document.getElementById(CONFIG.selectors.tagFilters),
        searchInput: document.getElementById(CONFIG.selectors.searchInput)
    };

    // ========================================
    // Data Fetching（データ取得）
    // ========================================
    /**
     * JSONデータの取得と初期化
     * lessons.json と tools.json を並列で取得し、
     * 取得完了後にレンダリングを実行
     */
    async function fetchData() {
        try {
            console.log('📊 データ取得を開始します...');
            console.log('Lessons path:', CONFIG.dataPaths.lessons);
            console.log('Tools path:', CONFIG.dataPaths.tools);

            const [lessonsRes, toolsRes] = await Promise.all([
                fetch(CONFIG.dataPaths.lessons),
                fetch(CONFIG.dataPaths.tools)
            ]);

            console.log('Lessons response status:', lessonsRes.status);
            console.log('Tools response status:', toolsRes.status);

            if (!lessonsRes.ok || !toolsRes.ok) {
                throw new Error('Failed to fetch data');
            }

            state.allLessons = await lessonsRes.json();
            state.allTools = await toolsRes.json();

            console.log('✅ データ取得成功:', state.allLessons.length, '件の授業記録');
            console.log('✅ ツール取得成功:', state.allTools.length, '件のツール');

            renderAll();
        } catch (error) {
            console.error('❌ データの取得に失敗しました:', error);
            showError('データの読み込みに失敗しました。ページを再読み込みしてください。');
        }
    }

    // ========================================
    // Rendering (描画)
    // ========================================
    function renderAll() {
        renderTools(state.allTools);
        renderLessons(state.allLessons);
        renderFilters(state.allLessons);
    }

    function renderTools(tools) {
        if (!elements.toolsContainer) return;
        elements.toolsContainer.innerHTML = tools.map(tool => Templates.toolCard(tool)).join('');
    }

    function renderLessons(lessons) {
        if (!elements.lessonsContainer) return;
        if (lessons.length === 0) {
            elements.lessonsContainer.innerHTML = `
                <div class="text-center text-slate-400 py-8">
                    該当する授業記録が見つかりませんでした。
                </div>
            `;
            return;
        }
        elements.lessonsContainer.innerHTML = lessons.map(lesson => Templates.lessonCard(lesson)).join('');
    }

    function renderFilters(lessons) {
        if (!elements.tagFilterContainer) return;

        const tags = [...new Set(lessons.flatMap(l => l.tags))];
        const allButton = Templates.filterButton(CONFIG.labels.allFilter, true);
        const tagButtons = tags.map(tag => Templates.filterButton(tag, false)).join('');

        elements.tagFilterContainer.innerHTML = allButton + tagButtons;
        attachFilterListeners();
    }

    function showError(message) {
        if (elements.lessonsContainer) {
            elements.lessonsContainer.innerHTML = `
                <div class="text-center text-red-400 py-8">
                    <span class="material-symbols-outlined text-3xl mb-2">error</span>
                    <p>${Templates.escapeHtml(message)}</p>
                </div>
            `;
        }
    }

    // ========================================
    // Filtering (フィルタリング)
    // ========================================
    function filterLessons(tag, query) {
        const normalizedQuery = query.toLowerCase().trim();

        const filtered = state.allLessons.filter(lesson => {
            const matchesTag = tag === 'all' || tag === CONFIG.labels.allFilter || lesson.tags.includes(tag);
            const matchesQuery = normalizedQuery === '' ||
                lesson.title.toLowerCase().includes(normalizedQuery) ||
                lesson.summary.toLowerCase().includes(normalizedQuery) ||
                lesson.unit.toLowerCase().includes(normalizedQuery);
            return matchesTag && matchesQuery;
        });

        renderLessons(filtered);
    }

    function updateActiveFilter(clickedBtn) {
        document.querySelectorAll('.filter-tag').forEach(btn => {
            btn.classList.remove(...CONFIG.classes.filterActive);
            btn.classList.add(...CONFIG.classes.filterInactive);
        });
        clickedBtn.classList.add(...CONFIG.classes.filterActive);
        clickedBtn.classList.remove(...CONFIG.classes.filterInactive);
    }

    // ========================================
    // Event Listeners (イベントリスナー)
    // ========================================
    function attachFilterListeners() {
        document.querySelectorAll('.filter-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                updateActiveFilter(btn);
                state.activeFilter = btn.dataset.tag;
                filterLessons(state.activeFilter, elements.searchInput?.value || '');
            });
        });
    }

    function initEventListeners() {
        if (elements.searchInput) {
            // debounce（遅延処理）で検索パフォーマンスを向上
            let debounceTimer;
            elements.searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    filterLessons(state.activeFilter, e.target.value);
                }, 150);
            });
        }
    }

    /**
     * CSVデータをパースして、指定されたテーマの雑学を表示
     */
    async function initHeroTrivia() {
        const heroTitle = document.getElementById('hero-title');
        if (!heroTitle) return;

        try {
            const response = await fetch(CONFIG.dataPaths.trivia);
            if (!response.ok) throw new Error('Trivia fetch failed');

            const csvText = await response.text();
            const rows = csvText.split('\n').map(row => row.split(','));

            // ヘッダーを除外してパース (theme, content)
            const triviaList = rows.slice(1)
                .filter(row => row.length >= 2)
                .map(row => ({
                    theme: row[0].trim(),
                    content: row[1].trim()
                }));

            // 指定されたテーマでフィルタリング
            const filteredTrivia = triviaList.filter(t => t.theme === CONFIG.activeTriviaTheme);

            // 該当するテーマがない場合は全リストから選択
            const sourceList = filteredTrivia.length > 0 ? filteredTrivia : triviaList;

            if (sourceList.length > 0) {
                const randomItem = sourceList[Math.floor(Math.random() * sourceList.length)];
                heroTitle.textContent = randomItem.content;
            } else {
                heroTitle.textContent = '学びを、もっと。';
            }
        } catch (error) {
            console.error('雑学の読み込みに失敗しました:', error);
            heroTitle.textContent = '学びを、もっと クリエイティブ に。';
        }
    }

    // 各ドロワーのセットアップ
    setupDrawer('nav-timetable', 'timetable-drawer');
    setupDrawer('nav-history', 'history-drawer');
    setupDrawer('nav-theme', 'theme-drawer');

    // テーマカスタマイズ機能
    function initThemeCustomization() {
        const hero = document.getElementById('hero-section');
        const colorGrid = document.getElementById('theme-color-grid');
        const imageUpload = document.getElementById('theme-image-upload');
        const resetBtn = document.getElementById('theme-reset');
        if (!hero || !colorGrid) return;

        const presets = [
            'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            '#1e293b', '#dc2626', '#ea580c', '#ca8a04',
            '#16a34a', '#0891b2', '#2563eb', '#9333ea', '#db2777',
            'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
            'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)',
            'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
            'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            '#171717', '#3f6212', '#1e40af', '#701a75'
        ];

        presets.forEach(color => {
            const btn = document.createElement('button');
            btn.className = 'size-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer';
            btn.style.background = color;
            btn.onclick = () => {
                hero.style.backgroundImage = 'none';
                hero.style.background = color;
                localStorage.setItem('portal_theme', JSON.stringify({ type: 'color', value: color }));
            };
            colorGrid.appendChild(btn);
        });

        imageUpload.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target.result;
                hero.style.background = 'none';
                hero.style.backgroundImage = `url(${dataUrl})`;
                hero.style.backgroundColor = 'black';
                localStorage.setItem('portal_theme', JSON.stringify({ type: 'image', value: dataUrl }));
            };
            reader.readAsDataURL(file);
        };

        resetBtn.onclick = () => {
            hero.style.backgroundImage = 'none';
            hero.style.background = presets[0];
            localStorage.removeItem('portal_theme');
        };

        const savedTheme = JSON.parse(localStorage.getItem('portal_theme'));
        if (savedTheme) {
            if (savedTheme.type === 'color') hero.style.background = savedTheme.value;
            else if (savedTheme.type === 'image') {
                hero.style.backgroundImage = `url(${savedTheme.value})`;
                hero.style.backgroundColor = 'black';
            }
        }
    }

    // リアクション履歴の描画とフィルタリング
    function renderHistory() {
        const container = document.getElementById('history-content');
        const monthFilter = document.getElementById('history-month-filter');
        const searchInput = document.getElementById('history-search');
        if (!container) return;

        const allHistory = JSON.parse(localStorage.getItem('lesson_submissions') || '[]');

        if (monthFilter && monthFilter.options.length === 1 && allHistory.length > 0) {
            const months = [...new Set(allHistory.map(item => {
                const date = item.timestamp.split(' ')[0];
                return date.substring(0, 7);
            }))].sort().reverse();

            months.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m.replace('-', '年 ') + '月';
                monthFilter.appendChild(opt);
            });

            monthFilter.addEventListener('change', renderHistory);
            searchInput.addEventListener('input', renderHistory);
        }

        const activeMonth = monthFilter ? monthFilter.value : 'all';
        const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';

        const filteredHistory = allHistory.filter(item => {
            const date = item.timestamp.split(' ')[0];
            const month = date.substring(0, 7);
            const matchesMonth = activeMonth === 'all' || month === activeMonth;
            const matchesSearch = item.lesson.toLowerCase().includes(searchQuery) ||
                item.summary.toLowerCase().includes(searchQuery);
            return matchesMonth && matchesSearch;
        });

        if (filteredHistory.length === 0) {
            container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400">履歴が見つかりませんでした。</div>`;
            return;
        }

        container.innerHTML = filteredHistory.map(item => {
            const lesson = state.allLessons.find(l => l.title.includes(item.lesson) || item.lesson.includes(l.title));
            return Templates.historyCard(item, lesson ? lesson.url : '#');
        }).join('');
    }

    initThemeCustomization();
}

    init();
});
