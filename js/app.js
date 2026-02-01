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

    function init() {
        initEventListeners();
        fetchData();
        initHeroTrivia();

        // 時間割の初期化
        if (typeof Timetable !== 'undefined') {
            Timetable.init();
        }

        // ToDoリストの初期化
        if (typeof ToDo !== 'undefined') {
            ToDo.init();
        }

        // ドロワー制御の追加（改善版）
        const navTimetable = document.getElementById('nav-timetable');
        const timetableDrawer = document.getElementById('timetable-drawer');

        if (navTimetable && timetableDrawer) {
            let isTransitioning = false;

            navTimetable.addEventListener('click', (e) => {
                e.preventDefault();
                if (isTransitioning) return; // 連続クリック防止

                const isOpen = timetableDrawer.classList.contains('is-open');

                if (!isOpen) {
                    // 開く処理
                    isTransitioning = true;
                    timetableDrawer.classList.add('is-open');
                    // 直接の子要素の高さを使用
                    const contentHeight = timetableDrawer.firstElementChild.scrollHeight;
                    timetableDrawer.style.height = contentHeight + 'px';

                    // transitionend イベントで完了を検知
                    const handleTransitionEnd = () => {
                        if (timetableDrawer.classList.contains('is-open')) {
                            timetableDrawer.style.height = 'auto';
                        }
                        isTransitioning = false;
                        timetableDrawer.removeEventListener('transitionend', handleTransitionEnd);
                    };
                    timetableDrawer.addEventListener('transitionend', handleTransitionEnd);
                } else {
                    // 閉じる処理
                    isTransitioning = true;
                    const contentHeight = timetableDrawer.firstElementChild.scrollHeight;
                    timetableDrawer.style.height = contentHeight + 'px';
                    timetableDrawer.offsetHeight; // リフロー強制
                    timetableDrawer.classList.remove('is-open');
                    timetableDrawer.style.height = '0px';

                    const handleTransitionEnd = () => {
                        isTransitioning = false;
                        timetableDrawer.removeEventListener('transitionend', handleTransitionEnd);
                    };
                    timetableDrawer.addEventListener('transitionend', handleTransitionEnd);
                }
            });

            // 内部要素の変化を検知して高さを再計算（編集パネルの開閉時など）
            const resizeObserver = new ResizeObserver(() => {
                if (timetableDrawer.classList.contains('is-open') &&
                    timetableDrawer.style.height === 'auto') {
                    // autoの場合のみ、高さを再計算する必要はない（自動調整される）
                    return;
                }
                if (timetableDrawer.classList.contains('is-open') && !isTransitioning) {
                    const contentHeight = timetableDrawer.firstElementChild.scrollHeight;
                    timetableDrawer.style.height = contentHeight + 'px';
                }
            });
            resizeObserver.observe(timetableDrawer.firstElementChild);
        }
    }

    init();
});
