/**
 * クラスポータル - メインアプリケーション
 */
document.addEventListener('DOMContentLoaded', () => {
    // ========================================
    // State
    // ========================================
    const state = {
        allLessons: [],
        allTools: [],
        activeFilter: 'all'
    };

    // ========================================
    // DOM Elements
    // ========================================
    const elements = {
        lessonsContainer: document.getElementById(CONFIG.selectors.lessonsContainer),
        toolsContainer: document.getElementById(CONFIG.selectors.toolsContainer),
        tagFilterContainer: document.getElementById(CONFIG.selectors.tagFilters),
        searchInput: document.getElementById(CONFIG.selectors.searchInput)
    };

    // ========================================
    // Rendering
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
            elements.lessonsContainer.innerHTML = `<div class="col-span-full py-20 text-center text-slate-400">授業記録が見つかりませんでした。</div>`;
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

    function attachFilterListeners() {
        document.querySelectorAll('.filter-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-tag').forEach(b => {
                    b.classList.remove(...CONFIG.classes.filterActive);
                    b.classList.add(...CONFIG.classes.filterInactive);
                });
                btn.classList.add(...CONFIG.classes.filterActive);
                btn.classList.remove(...CONFIG.classes.filterInactive);
                state.activeFilter = btn.dataset.tag;
                filterLessons(state.activeFilter, elements.searchInput?.value || '');
            });
        });
    }

    // ========================================
    // Drawers
    // ========================================
    function setupDrawer(navId, drawerId) {
        const nav = document.getElementById(navId);
        const drawer = document.getElementById(drawerId);
        if (!nav || !drawer) return;

        let isTransitioning = false;

        nav.addEventListener('click', (e) => {
            e.preventDefault();
            if (isTransitioning) return;

            const isOpen = drawer.classList.contains('is-open');

            if (!isOpen) {
                if (drawerId === 'history-drawer') renderHistory();
                isTransitioning = true;
                drawer.classList.add('is-open');
                const contentHeight = drawer.firstElementChild.scrollHeight;
                drawer.style.height = contentHeight + 'px';
                const handleTransitionEnd = () => {
                    if (drawer.classList.contains('is-open')) drawer.style.height = 'auto';
                    isTransitioning = false;
                    drawer.removeEventListener('transitionend', handleTransitionEnd);
                };
                drawer.addEventListener('transitionend', handleTransitionEnd);
            } else {
                isTransitioning = true;
                const contentHeight = drawer.firstElementChild.scrollHeight;
                drawer.style.height = contentHeight + 'px';
                drawer.offsetHeight; // force reflow
                drawer.classList.remove('is-open');
                drawer.style.height = '0px';
                const handleTransitionEnd = () => {
                    isTransitioning = false;
                    drawer.removeEventListener('transitionend', handleTransitionEnd);
                };
                drawer.addEventListener('transitionend', handleTransitionEnd);
            }
        });
    }

    // ========================================
    // Theme Customization
    // ========================================
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

    // ========================================
    // History
    // ========================================
    function renderHistory() {
        const container = document.getElementById('history-content');
        const monthFilter = document.getElementById('history-month-filter');
        const searchInput = document.getElementById('history-search');
        if (!container) return;

        const allHistory = JSON.parse(localStorage.getItem('lesson_submissions') || '[]');
        if (allHistory.length === 0) {
            container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400">履歴がまだありません。</div>`;
            return;
        }

        if (monthFilter && monthFilter.options.length === 1) {
            const months = [...new Set(allHistory.map(item => item.timestamp.split(' ')[0].substring(0, 7)))].sort().reverse();
            months.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m.replace('-', '年 ') + '月';
                monthFilter.appendChild(opt);
            });
            monthFilter.addEventListener('change', renderHistory);
            searchInput.addEventListener('input', renderHistory);
        }

        const activeMonth = monthFilter?.value || 'all';
        const searchQuery = searchInput?.value.toLowerCase() || '';

        const filtered = allHistory.filter(item => {
            const month = item.timestamp.split(' ')[0].substring(0, 7);
            const matchesMonth = activeMonth === 'all' || month === activeMonth;
            const matchesSearch = item.lesson.toLowerCase().includes(searchQuery) || item.summary.toLowerCase().includes(searchQuery);
            return matchesMonth && matchesSearch;
        });

        container.innerHTML = filtered.map(item => {
            const lesson = state.allLessons.find(l => l.title.includes(item.lesson) || item.lesson.includes(l.title));
            return Templates.historyCard(item, lesson ? lesson.url : '#');
        }).join('');
    }

    // ========================================
    // Data Loading
    // ========================================
    async function fetchData() {
        try {
            const [lessonsRes, toolsRes] = await Promise.all([
                fetch(CONFIG.dataPaths.lessons),
                fetch(CONFIG.dataPaths.tools)
            ]);
            state.allLessons = await lessonsRes.json();
            state.allTools = await toolsRes.json();
            renderAll();
        } catch (error) {
            console.error('Data fetch error:', error);
        }
    }

    // ========================================
    // Initialize
    // ========================================
    function init() {
        fetchData();
        setupDrawer('nav-timetable', 'timetable-drawer');
        setupDrawer('nav-history', 'history-drawer');
        setupDrawer('nav-theme', 'theme-drawer');
        initThemeCustomization();

        if (elements.searchInput) {
            let debounceTimer;
            elements.searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => filterLessons(state.activeFilter, e.target.value), 150);
            });
        }

        if (typeof Timetable !== 'undefined') Timetable.init();
        if (typeof ToDo !== 'undefined') ToDo.init();
        if (typeof initHeroTrivia !== 'undefined') initHeroTrivia();
    }

    init();
});
