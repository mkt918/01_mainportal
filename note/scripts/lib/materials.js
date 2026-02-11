const { REGEX } = require('./config');

/**
 * 資料セクションをアコーディオン形式に変換
 */
function convertMaterialsToAccordion(htmlContent) {
    return htmlContent.replace(REGEX.materials, (match, listContent) => {
        const materials = [];
        let linkMatch;

        const linkRegex = new RegExp(REGEX.materialLink.source, 'g');
        while ((linkMatch = linkRegex.exec(listContent)) !== null) {
            const url = linkMatch[1];
            const title = linkMatch[2];
            const isPDF = url.toLowerCase().endsWith('.pdf') || url.includes('drive.google.com');

            if (isPDF) {
                // ローカルファイル（相対パス）はそのまま、外部URLはビューアー経由
                const isLocal = url.startsWith('./') || url.startsWith('../') || !url.startsWith('http');
                const embedUrl = url.includes('drive.google.com')
                    ? url.replace('/view', '/preview')
                    : isLocal
                        ? url
                        : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

                materials.push(`
                    <div class="mb-4">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-indigo-600">picture_as_pdf</span>
                                <span class="font-semibold">${title}</span>
                            </div>
                            <span class="material-symbols-outlined accordion-icon text-slate-400">expand_more</span>
                        </div>
                        <div class="accordion-content">
                            <div class="p-4 bg-white rounded-lg">
                                <div class="flex justify-end mb-2">
                                    <button onclick="openFullscreen('${embedUrl}')" class="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg">
                                        <span class="material-symbols-outlined text-sm">open_in_new</span> 全画面で開く
                                    </button>
                                </div>
                                <iframe src="${embedUrl}" class="pdf-viewer"></iframe>
                            </div>
                        </div>
                    </div>
                `);
            } else {
                materials.push(`
                    <div class="mb-4">
                        <a href="${url}" target="_blank" class="accordion-header block hover:no-underline">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-indigo-600">link</span>
                                <span class="font-semibold">${title}</span>
                            </div>
                            <span class="material-symbols-outlined text-slate-400">open_in_new</span>
                        </a>
                    </div>
                `);
            }
        }

        return `
            <div class="section-card">
                <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
                    <span class="material-symbols-outlined text-indigo-600">folder_open</span>
                    資料
                </h2>
                ${materials.join('')}
            </div>
        `;
    });
}

module.exports = {
    convertMaterialsToAccordion
};
