/**
 * ToDoリスト機能モジュール
 * 重要(5個)・通常(15個)の2カラム構成、ドラッグ＆ドロップ対応
 */
import { Templates } from './templates.js';

export const ToDo = {
    STORAGE_KEY: 'class_portal_todo',

    state: {
        important: [], // { id: number, title: string }
        normal: []
    },

    limits: {
        important: 5,
        normal: 15
    },

    /**
     * 初期化
     */
    init() {
        this.loadData();
        this.renderAll();
        this.initEventListeners();
    },

    /**
     * データ読み込み（エラーハンドリング付き）
     */
    loadData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // データ構造の検証
                if (parsed && typeof parsed === 'object' &&
                    Array.isArray(parsed.important) && Array.isArray(parsed.normal)) {
                    this.state = parsed;
                } else {
                    throw new Error('Invalid data structure');
                }
            }
        } catch (error) {
            console.error('ToDoデータの読み込みに失敗しました:', error);
            this.state = { important: [], normal: [] };
            this.saveData(); // 破損データを初期化して保存
        }
    },

    /**
     * データ保存（エラーハンドリング付き）
     */
    saveData() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
        } catch (error) {
            console.error('ToDoデータの保存に失敗しました:', error);
            alert('データの保存に失敗しました。ストレージの容量を確認してください。');
        }
    },

    /**
     * 両方のリストを描画
     */
    renderAll() {
        this.renderList('important');
        this.renderList('normal');
        this.updateCounts();
    },

    /**
     * 特定のリストを描画
     */
    renderList(type) {
        const container = document.getElementById(`todo-list-${type}`);
        if (!container) return;

        const tasks = this.state[type];

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="py-4 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-300 text-xs">
                    タスクがありません
                </div>
            `;
        } else {
            container.innerHTML = tasks.map(task => `
                <div class="todo-item group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all" 
                     draggable="true" data-id="${task.id}" data-current-type="${type}">
                    <span class="material-symbols-outlined text-slate-300 text-sm">drag_indicator</span>
                    <span class="flex-1 text-sm text-slate-700">${Templates.escapeHtml(task.title)}</span>
                    <button class="todo-delete-btn opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all" data-id="${task.id}" data-type="${type}">
                        <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            `).join('');
        }

        // イベント再登録
        this.initDragAndDrop(container);
        container.querySelectorAll('.todo-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                const listType = btn.dataset.type;
                this.deleteTask(listType, id);
            });
        });
    },

    /**
     * カウンター表示の更新
     */
    updateCounts() {
        const impCount = document.getElementById('todo-count-important');
        const norCount = document.getElementById('todo-count-normal');
        if (impCount) impCount.textContent = `(${this.state.important.length}/${this.limits.important})`;
        if (norCount) norCount.textContent = `(${this.state.normal.length}/${this.limits.normal})`;
    },

    /**
     * タスク追加（通常タスクに追加）
     */
    addTask(title) {
        if (!title) return;

        // 上限チェック
        if (this.state.normal.length >= this.limits.normal) {
            alert(`通常タスクは${this.limits.normal}個までしか登録できません。内容を整理してください。`);
            return;
        }

        // 新規タスクの作成
        const newTask = {
            id: Date.now(),
            title: title
        };

        this.state.normal.push(newTask);
        this.saveData();
        this.renderList('normal');
        this.updateCounts();
    },

    /**
     * タスク削除
     */
    deleteTask(type, id) {
        this.state[type] = this.state[type].filter(t => t.id !== id);
        this.saveData();
        this.renderList(type);
        this.updateCounts();
    },

    /**
     * ドラッグ＆ドロップの初期化
     */
    initDragAndDrop(container) {
        container.querySelectorAll('.todo-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    id: parseInt(item.dataset.id),
                    fromType: item.dataset.currentType
                }));
                item.classList.add('opacity-40');
            });
            item.addEventListener('dragend', () => item.classList.remove('opacity-40'));
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('bg-primary/5', 'ring-2', 'ring-primary/20');
        });

        container.addEventListener('dragleave', () => {
            container.classList.remove('bg-primary/5', 'ring-2', 'ring-primary/20');
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('bg-primary/5', 'ring-2', 'ring-primary/20');

            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const targetType = container.dataset.type;

            // 同じリスト内でのドロップは無視
            if (data.fromType === targetType) return;

            // 移動対象のタスクを取得
            const taskToMove = this.state[data.fromType].find(t => t.id === data.id);
            if (!taskToMove) return;

            // 移動先の上限チェック
            if (this.state[targetType].length >= this.limits[targetType]) {
                alert(`${targetType === 'important' ? '重要' : '通常'}タスクの上限は${this.limits[targetType]}個です。`);
                return;
            }

            // タスクの移動処理
            this.state[data.fromType] = this.state[data.fromType].filter(t => t.id !== data.id);
            this.state[targetType].push(taskToMove);

            this.saveData();
            this.renderAll();
        });
    },

    /**
     * UIの初期化
     */
    initEventListeners() {
        const addBtn = document.getElementById('todo-add-btn');
        const inputPanel = document.getElementById('todo-input-panel');
        const saveBtn = document.getElementById('todo-save-btn');
        const cancelBtn = document.getElementById('todo-cancel-btn');
        const titleInput = document.getElementById('todo-new-title');

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                inputPanel.classList.toggle('hidden');
                if (!inputPanel.classList.contains('hidden')) titleInput.focus();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                inputPanel.classList.add('hidden');
                titleInput.value = '';
            });
        }

        const handleSave = () => {
            const title = titleInput.value.trim();
            if (title) {
                this.addTask(title);
                titleInput.value = '';
                inputPanel.classList.add('hidden');
            }
        };

        if (saveBtn) saveBtn.addEventListener('click', handleSave);
        if (titleInput) {
            titleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSave();
            });
        }
    }
};
