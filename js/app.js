/**
 * クラスポータル - メインアプリケーション
 */
import { CONFIG } from './config.js';
import { Templates } from './templates.js';
import { Timetable } from './timetable.js';
import { ToDo } from './todo.js';

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
        const gradientGrid = document.getElementById('theme-gradient-grid');
        const triviaSelect = document.getElementById('theme-trivia-category');
        const imageUpload = document.getElementById('theme-image-upload');
        const resetBtn = document.getElementById('theme-reset');
        if (!hero) return;

        // カラープリセット（40色 - 色相環順にバランスよく配置）
        const solidPresets = [
            '#0f172a', '#1e293b', '#334155', '#475569', '#64748b', // Slate/Gray
            '#450a0a', '#991b1b', '#dc2626', '#f87171', '#fecaca', // Red
            '#431407', '#9a3412', '#ea580c', '#fb923c', '#ffedd5', // Orange
            '#3f2f06', '#854d0e', '#ca8a04', '#facc15', '#fef9c3', // Amber/Yellow
            '#064e3b', '#047857', '#10b981', '#6ee7b7', '#d1fae5', // Emerald/Green
            '#164e63', '#0891b2', '#22d3ee', '#a5f3fc', '#ecfeff', // Cyan
            '#172554', '#1e40af', '#2563eb', '#60a5fa', '#dbeafe', // Blue
            '#312e81', '#4338ca', '#6366f1', '#a5b4fc', '#e0e7ff', // Indigo
            '#4c1d95', '#6d28d9', '#8b5cf6', '#c4b5fd', '#ede9fe', // Violet
            '#701a75', '#be185d', '#db2777', '#f472b6', '#fce7f3'  // Pink
        ];

        // グラデーションプリセット（20色 - 色相順かつ視認性の高いペア）
        const gradientPresets = [
            'linear-gradient(135deg, #0f172a 0%, #334155 100%)', // Dark Slate
            'linear-gradient(135deg, #450a0a 0%, #991b1b 100%)', // Deep Red
            'linear-gradient(135deg, #dc2626 0%, #f43f5e 100%)', // Vibrant Red
            'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', // Bright Orange
            'linear-gradient(135deg, #f59e0b 0%, #facc15 100%)', // Golden Amber
            'linear-gradient(135deg, #65a30d 0%, #a3e635 100%)', // Lime Punch
            'linear-gradient(135deg, #059669 0%, #10b981 100%)', // Emerald Green
            'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)', // Teal Wave
            'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)', // Cyan Sky
            'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', // Sky Blue
            'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)', // Royal Blue
            'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)', // Indigo Glow
            'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', // Violet Magic
            'linear-gradient(135deg, #9333ea 0%, #c084fc 100%)', // Purple Haze
            'linear-gradient(135deg, #c026d3 0%, #e879f9 100%)', // Fuchsia
            'linear-gradient(135deg, #db2777 0%, #f472b6 100%)', // Pink Glam
            'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)', // Rose Petal
            'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)', // Sunset
            'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', // Cosmic
            'linear-gradient(135deg, #312e81 0%, #4c1d95 100%)'  // Midnight
        ];

        const applyTheme = (value) => {
            hero.style.backgroundImage = 'none';
            hero.style.background = value;
            localStorage.setItem('portal_theme', JSON.stringify({ type: 'color', value }));
        };

        const renderPresets = (presets, container) => {
            if (!container) return;
            container.innerHTML = '';
            presets.forEach(color => {
                const btn = document.createElement('button');
                btn.className = 'size-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer';
                btn.style.background = color;
                btn.onclick = () => applyTheme(color);
                container.appendChild(btn);
            });
        };

        renderPresets(solidPresets, colorGrid);
        renderPresets(gradientPresets, gradientGrid);

        // 雑学カテゴリ設定
        if (triviaSelect) {
            const savedCategory = localStorage.getItem('portal_trivia_category') || 'all';
            triviaSelect.value = savedCategory;
            triviaSelect.onchange = (e) => {
                localStorage.setItem('portal_trivia_category', e.target.value);
                if (typeof initHeroTrivia === 'function') initHeroTrivia();
            };
        }

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
            hero.style.background = gradientPresets[0];
            localStorage.removeItem('portal_theme');
        };

        try {
            const savedTheme = JSON.parse(localStorage.getItem('portal_theme'));
            if (savedTheme) {
                if (savedTheme.type === 'color') hero.style.background = savedTheme.value;
                else if (savedTheme.type === 'image') {
                    hero.style.backgroundImage = `url(${savedTheme.value})`;
                    hero.style.backgroundColor = 'black';
                }
            }
        } catch (error) {
            console.error('テーマデータの読み込みに失敗しました:', error);
            localStorage.removeItem('portal_theme');
        }
    }

    // ========================================
    // History
    // ========================================
    let historyListenersInitialized = false;

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

        // イベントリスナーの初期化（一度だけ）
        if (!historyListenersInitialized && monthFilter && searchInput) {
            const months = [...new Set(allHistory.map(item => item.timestamp.split(' ')[0].substring(0, 7)))].sort().reverse();
            months.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m.replace('-', '年 ') + '月';
                monthFilter.appendChild(opt);
            });
            monthFilter.addEventListener('change', renderHistory);
            searchInput.addEventListener('input', renderHistory);
            historyListenersInitialized = true;
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
            // マッチングルールの改善: 
            // 1. カッコやハイフン以降を無視して基本名で比較
            // 2. 相互の部分一致をチェック
            const cleanTitle = (t) => t.split(/[（( \-－]/)[0].trim().toLowerCase();
            const itemBase = cleanTitle(item.lesson);

            const lesson = state.allLessons.find(l => {
                const masterBase = cleanTitle(l.title);
                const isMatch = itemBase.includes(masterBase) || masterBase.includes(itemBase) ||
                    item.lesson.includes(l.title) || l.title.includes(item.lesson);
                return isMatch;
            });
            return Templates.historyCard(item, lesson ? lesson.url : '#');
        }).join('');
    }

    // ========================================
    // Data Loading
    // ========================================
    /**
     * 簡易CSVパーサー（ダブルクォート内のカンマをエスケープ）
     */
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    async function initHeroTrivia() {
        const heroTitle = document.getElementById('hero-title');
        if (!heroTitle) return;

        try {
            const response = await fetch(CONFIG.dataPaths.trivia);
            if (!response.ok) throw new Error('Trivia fetch failed');

            const csvText = await response.text();
            const lines = csvText.trim().split('\n');
            const rows = lines.map(line => parseCSVLine(line));

            const triviaList = rows.slice(1)
                .filter(row => row.length >= 3)
                .map(row => ({
                    theme: row[0].trim(),
                    content: row[1].trim(),
                    description: row[2].trim()
                }));

            // カテゴリ選択肢の初期化（一度だけ）
            const triviaSelect = document.getElementById('theme-trivia-category');
            if (triviaSelect && triviaSelect.options.length === 1 && triviaList.length > 0) {
                const themes = [...new Set(triviaList.map(t => t.theme))];
                themes.forEach(theme => {
                    const opt = document.createElement('option');
                    opt.value = theme;
                    opt.textContent = theme;
                    triviaSelect.appendChild(opt);
                });
                triviaSelect.value = localStorage.getItem('portal_trivia_category') || 'all';
            }

            const activeCategory = localStorage.getItem('portal_trivia_category') || 'all';
            const filteredTrivia = activeCategory === 'all' ? triviaList : triviaList.filter(t => t.theme === activeCategory);

            if (filteredTrivia.length > 0) {
                const randomItem = filteredTrivia[Math.floor(Math.random() * filteredTrivia.length)];
                heroTitle.textContent = randomItem.content;

                // 解説文を表示（hero-subtitleがあれば）
                const heroSubtitle = document.getElementById('hero-subtitle');
                if (heroSubtitle) {
                    heroSubtitle.textContent = randomItem.description || 'このサイトは授業の資料、便利な学習ツール、過去の授業記録をまとめたクラス専用ポータルです。';
                    heroSubtitle.classList.add('opacity-80');
                }
            }
        } catch (error) {
            console.error('Trivia error:', error);
        }
    }

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

        const refreshBtn = document.getElementById('refresh-trivia');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => initHeroTrivia());
        }

        if (typeof Timetable !== 'undefined') Timetable.init();
        if (typeof ToDo !== 'undefined') ToDo.init();
        if (typeof initHeroTrivia === 'function') initHeroTrivia();
    }

    init();
});
