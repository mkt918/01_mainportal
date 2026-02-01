/**
 * HTMLテンプレート生成関数（ライトモード対応版）
 * UIコンポーネントのHTMLを一元管理し、再利用性を高める
 */
import { CONFIG } from './config.js';

export const Templates = {
    /**
     * ツールカードのHTMLを生成
     * @param {Object} tool - ツールデータ
     * @returns {string} HTML文字列
     */
    toolCard(tool) {
        const tagsHtml = tool.tags
            .map(tag => `<span class="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded border border-primary/20 font-medium">${this.escapeHtml(tag).toUpperCase()}</span>`)
            .join('');

        return `
            <div class="group relative flex flex-col overflow-hidden rounded-xl bg-white border border-slate-200 neon-glow transition-all duration-300 shadow-sm">
                <div class="aspect-video bg-cover bg-center" style='background-image: url("${this.escapeHtml(tool.image)}")'>
                    <div class="inset-0 bg-black/10 group-hover:bg-black/5 transition-colors h-full w-full"></div>
                </div>
                <div class="p-6">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="material-symbols-outlined text-primary text-xl">${this.escapeHtml(tool.icon)}</span>
                        <h3 class="text-slate-800 text-xl font-bold">${this.escapeHtml(tool.name)}</h3>
                    </div>
                    <p class="text-slate-500 text-sm mb-4">${this.escapeHtml(tool.description)}</p>
                    <div class="flex flex-wrap gap-2 mb-4">${tagsHtml}</div>
                    <a href="${this.escapeHtml(tool.url)}" target="_blank" rel="noopener noreferrer" class="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
                        ${CONFIG.labels.useTool} <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </a>
                </div>
            </div>
        `;
    },

    /**
     * リアクション履歴カードのHTMLを生成
     * @param {Object} item - 提出データ
     * @param {string} lessonUrl - 該当授業のURL
     * @returns {string} HTML文字列
     */
    historyCard(item, lessonUrl = '#') {
        const displayDate = item.timestamp.split(' ')[0]; // yyyy-mm-ddのみ
        return `
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:bg-white group">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">schedule</span> ${displayDate}
                    </span>
                    <a href="${this.escapeHtml(lessonUrl)}" class="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
                        授業ページ <span class="material-symbols-outlined text-[10px]">open_in_new</span>
                    </a>
                </div>
                <h4 class="text-slate-800 font-bold mb-2 text-sm leading-snug">
                    <a href="${this.escapeHtml(lessonUrl)}" class="hover:text-primary transition-colors">
                        ${this.escapeHtml(item.lesson)}
                    </a>
                </h4>
                <div class="space-y-2">
                    <div class="text-slate-600 text-xs line-clamp-2 italic">
                        "${this.escapeHtml(item.summary)}"
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 授業カードのHTMLを生成 (テキストのみ・コンパクト版)
     * @param {Object} lesson - 授業データ
     * @returns {string} HTML文字列
     */
    lessonCard(lesson) {
        const tagsHtml = lesson.tags
            .map(tag => `<span class="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 font-medium">#${this.escapeHtml(tag)}</span>`)
            .join(' ');

        return `
            <div class="flex flex-col bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group lesson-item h-full" data-tags="${this.escapeHtml(lesson.tags.join(','))}">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-1.5 text-primary text-[10px] font-bold">
                        <span class="material-symbols-outlined text-sm">calendar_month</span> ${this.escapeHtml(lesson.date)}
                    </div>
                </div>
                
                <h4 class="text-slate-800 text-sm font-extrabold mb-3 leading-snug line-clamp-2 min-h-[2.5rem]">
                    ${this.escapeHtml(lesson.title)}
                </h4>
                
                <p class="text-slate-500 text-[11px] leading-relaxed line-clamp-3 mb-4 flex-grow">
                    ${this.escapeHtml(lesson.summary)}
                </p>
                
                <div class="pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div class="flex flex-wrap gap-1">${tagsHtml}</div>
                    <a class="text-primary hover:text-primary-dark transition-all transform group-hover:scale-110" href="${this.escapeHtml(lesson.url)}" title="詳細を見る">
                        <span class="material-symbols-outlined text-lg">arrow_forward</span>
                    </a>
                </div>
            </div>
        `;
    },

    /**
     * フィルターボタンのHTMLを生成
     * @param {string} tag - タグ名
     * @param {boolean} isActive - アクティブ状態
     * @returns {string} HTML文字列
     */
    filterButton(tag, isActive = false) {
        const activeClasses = isActive
            ? 'border-primary text-primary bg-primary/10 active'
            : 'border-slate-200 text-slate-500 bg-white';
        return `<button class="filter-tag px-3 py-1 rounded-full border text-xs font-medium hover:border-primary hover:text-primary transition-all shadow-sm ${activeClasses}" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</button>`;
    },

    /**
     * XSS対策: HTMLエスケープ
     * @param {string} str - エスケープする文字列
     * @returns {string} エスケープされた文字列
     */
    escapeHtml(str) {
        if (str == null) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};
