/**
 * 時間割機能モジュール
 * デザインと操作性を刷新
 */
const Timetable = {
    STORAGE_KEY: 'class_portal_timetable',

    // カラーテンプレート（10色のプリセット）
    colors: [
        '#e1effe', // 青
        '#fef3c7', // 琥珀
        '#dcfce7', // 緑
        '#f3e8ff', // 紫
        '#fee2e2', // 赤
        '#ffedd5', // オレンジ
        '#e0f2fe', // 空色
        '#f1f5f9', // スレート
        '#fae8ff', // フクシア
        '#ecfdf5'  // エメラルド
    ],

    defaultData: Array(6).fill(null).map(() => Array(5).fill({ subject: '', teacher: '', color: '' })),

    state: {
        data: [],
        isEditMode: false,
        isApplying: false,
        selectedSubject: '',
        selectedTeacher: '',
        selectedColor: '#e1effe'
    },

    init() {
        this.loadData();
        this.renderGrid();
        this.renderColorPalette();
        this.initEventListeners();
    },

    /**
     * データ読み込み（エラーハンドリング付き）
     */
    loadData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                this.state.data = JSON.parse(saved);
                // データ構造の検証
                if (!Array.isArray(this.state.data) || this.state.data.length !== 6) {
                    throw new Error('Invalid data structure');
                }
            } else {
                this.state.data = JSON.parse(JSON.stringify(this.defaultData));
            }
        } catch (error) {
            console.error('時間割データの読み込みに失敗しました:', error);
            this.state.data = JSON.parse(JSON.stringify(this.defaultData));
            this.saveData(); // 破損データを初期化して保存
        }
    },

    /**
     * データ保存（エラーハンドリング付き）
     */
    saveData() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state.data));
        } catch (error) {
            console.error('時間割データの保存に失敗しました:', error);
            alert('データの保存に失敗しました。ストレージの容量を確認してください。');
        }
    },

    /**
     * グリッドの描画 (図形囲みを削除し、セル全体に背景色を適用)
     */
    renderGrid() {
        const grid = document.getElementById('timetable-grid');
        if (!grid) return;

        const days = ['月', '火', '水', '木', '金'];

        let html = `
            <thead>
                <tr class="bg-slate-50 border-b border-slate-200">
                    <th class="p-3 text-xs font-bold text-slate-400 border-r border-slate-200 w-16 text-center">時限</th>
                    ${days.map(day => `<th class="p-3 text-sm font-bold text-slate-700 text-center">${day}曜日</th>`).join('')}
                </tr>
            </thead>
            <tbody>
        `;

        for (let period = 0; period < 6; period++) {
            html += `
                <tr class="border-b border-slate-100 last:border-0 h-28">
                    <td class="p-3 text-center border-r border-slate-200 bg-slate-50/50">
                        <span class="text-sm font-bold text-slate-400">${period + 1}</span>
                    </td>
                    ${[0, 1, 2, 3, 4].map(day => {
                const { subject, teacher, color } = this.state.data[period][day];
                const bgColor = subject ? (color || '#e1effe') : 'transparent';

                return `
                            <td class="p-0 border-r border-slate-100 last:border-0 transition-all timetable-cell cursor-pointer hover:brightness-95" 
                                data-period="${period}" data-day="${day}"
                                style="background-color: ${bgColor};">
                                <div class="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                                    <span class="text-sm font-bold text-slate-800 leading-tight">${Templates.escapeHtml(subject)}</span>
                                    ${teacher ? `<span class="text-[10px] text-slate-500 mt-1 font-medium">${Templates.escapeHtml(teacher)}</span>` : ''}
                                </div>
                            </td>
                        `;
            }).join('')}
                </tr>
            `;
        }

        html += `</tbody>`;
        grid.innerHTML = html;

        grid.querySelectorAll('.timetable-cell').forEach(cell => {
            cell.addEventListener('click', () => this.handleCellClick(cell));
        });
    },

    /**
     * カラーパレットの描画
     */
    renderColorPalette() {
        const palette = document.getElementById('timetable-color-palette');
        if (!palette) return;

        palette.innerHTML = this.colors.map(color => `
            <button class="color-swatch size-8 rounded-full border-2 transition-all hover:scale-110" 
                    style="background-color: ${color}; border-color: ${color === this.state.selectedColor ? 'rgba(37, 99, 235, 0.5)' : 'white'};"
                    data-color="${color}" title="${color}">
            </button>
        `).join('');

        palette.querySelectorAll('.color-swatch').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.selectedColor = btn.dataset.color;
                this.renderColorPalette(); // 選択状態の更新
            });
        });
    },

    /**
     * セルクリック時の処理
     */
    handleCellClick(cell) {
        const period = parseInt(cell.dataset.period);
        const day = parseInt(cell.dataset.day);

        if (this.state.isApplying && this.state.selectedSubject) {
            // 配置モード: クリックした場所に即座に配置
            this.state.data[period][day] = {
                subject: this.state.selectedSubject,
                teacher: this.state.selectedTeacher,
                color: this.state.selectedColor
            };
            this.saveData();
            this.renderGrid();
        } else if (!this.state.isApplying) {
            // 通常モード: クリックで削除
            if (this.state.data[period][day].subject) {
                if (confirm('この時間を削除しますか？')) {
                    this.state.data[period][day] = { subject: '', teacher: '', color: '' };
                    this.saveData();
                    this.renderGrid();
                }
            }
        }
    },

    /**
     * イベントリスナーの初期化
     */
    initEventListeners() {
        const editToggle = document.getElementById('timetable-edit-toggle');
        const applyBtn = document.getElementById('timetable-apply-btn');
        const editPanel = document.getElementById('timetable-edit-panel');
        const subjectInput = document.getElementById('timetable-subject-name');
        const teacherInput = document.getElementById('timetable-teacher-name');
        const statusMsg = document.getElementById('timetable-status-msg');

        // 編集パネルの開閉
        if (editToggle) {
            editToggle.addEventListener('click', () => {
                this.state.isEditMode = !this.state.isEditMode;
                editPanel.classList.toggle('hidden', !this.state.isEditMode);
            });
        }

        // 配置モードの開始/終了
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                if (!this.state.isApplying) {
                    // モード開始
                    const subject = subjectInput.value.trim();
                    if (!subject) {
                        alert('科目名を入力してください');
                        return;
                    }
                    this.state.selectedSubject = subject;
                    this.state.selectedTeacher = teacherInput.value.trim();
                    this.state.isApplying = true;
                    applyBtn.textContent = '配置モードを終了';
                    applyBtn.classList.replace('bg-primary', 'bg-slate-800');
                    statusMsg.classList.remove('invisible');
                } else {
                    // モード終了
                    this.state.isApplying = false;
                    applyBtn.textContent = '配置モード開始';
                    applyBtn.classList.replace('bg-slate-800', 'bg-primary');
                    statusMsg.classList.add('invisible');
                }
            });
        }
    }
};
