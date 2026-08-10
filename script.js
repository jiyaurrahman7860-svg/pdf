// --- SaveFast Tool UI & Manual Download System ---
window.SaveFastToolUI = {
    showProcessing: function(containerEl, initialTitle, initialSubtitle) {
        if (!containerEl) containerEl = document.getElementById('file-drop-zone') || document.querySelector('.drop-zone');
        if (!containerEl) return;

        if (!containerEl.dataset.origHtml) {
            containerEl.dataset.origHtml = containerEl.innerHTML;
        }

        containerEl.innerHTML = `
            <div class="savefast-processing-box">
                <div class="savefast-spinner-container">
                    <div class="savefast-ring"></div>
                    <div class="savefast-spinner-icon">⚡</div>
                </div>
                <div class="savefast-status-title" id="savefast-proc-title">${initialTitle || '📤 Processing Document...'}</div>
                <div class="savefast-status-subtitle" id="savefast-proc-subtitle">${initialSubtitle || 'Preparing file for conversion and optimization'}</div>
                <div class="savefast-progress-track">
                    <div class="savefast-progress-bar" id="savefast-proc-bar" style="width: 15%;"></div>
                </div>
                <div class="savefast-progress-percent" id="savefast-proc-percent">15%</div>
            </div>
        `;

        let progress = 15;
        const interval = setInterval(() => {
            if (progress < 92) {
                progress += Math.floor(Math.random() * 8) + 3;
                if (progress > 92) progress = 92;
                
                const bar = document.getElementById('savefast-proc-bar');
                const pct = document.getElementById('savefast-proc-percent');
                const title = document.getElementById('savefast-proc-title');
                const sub = document.getElementById('savefast-proc-subtitle');
                
                if (bar) bar.style.width = progress + '%';
                if (pct) pct.textContent = progress + '%';

                if (progress > 40 && progress <= 70) {
                    if (title) title.textContent = '⚙️ Processing & Converting Document...';
                    if (sub) sub.textContent = 'Applying formatting and layout optimizations';
                } else if (progress > 70) {
                    if (title) title.textContent = '✨ Finalizing Output Document...';
                    if (sub) sub.textContent = 'Almost done, generating output file';
                }
            }
        }, 350);

        containerEl.dataset.timerId = interval;
    },

    showSuccess: function(containerEl, blobOrData, fileName, mimeType) {
        if (!containerEl) containerEl = document.getElementById('file-drop-zone') || document.querySelector('.drop-zone');
        if (!containerEl) return;

        if (containerEl.dataset.timerId) {
            clearInterval(parseInt(containerEl.dataset.timerId));
        }

        let blob = blobOrData;
        if (!(blobOrData instanceof Blob)) {
            blob = new Blob([blobOrData], { type: mimeType || 'application/octet-stream' });
        }

        const objectUrl = URL.createObjectURL(blob);
        const displayFileName = fileName || 'converted-file.pdf';

        containerEl.innerHTML = `
            <div class="savefast-success-box">
                <div class="savefast-success-icon">🎉</div>
                <div class="savefast-success-title">Conversion Successful!</div>
                <div class="savefast-success-filename">📄 ${displayFileName}</div>
                <div class="savefast-download-actions">
                    <a href="${objectUrl}" download="${displayFileName}" class="savefast-btn-download" id="savefast-download-btn">
                        <span>📥 Download Converted File</span>
                    </a>
                    <button type="button" class="savefast-btn-reset" onclick="window.SaveFastToolUI.reset('${containerEl.id || 'file-drop-zone'}')">
                        🔄 Convert Another File
                    </button>
                </div>
            </div>
        `;

        const statusArea = document.getElementById('status-area');
        if (statusArea) {
            statusArea.textContent = '✅ File ready for download! Click the button above.';
        }
    },

    showError: function(containerEl, errorMsg) {
        if (!containerEl) containerEl = document.getElementById('file-drop-zone') || document.querySelector('.drop-zone');
        if (!containerEl) return;

        if (containerEl.dataset.timerId) {
            clearInterval(parseInt(containerEl.dataset.timerId));
        }

        containerEl.innerHTML = `
            <div class="savefast-processing-box" style="border-color: #ef4444; background: rgba(239, 68, 68, 0.1);">
                <div style="font-size: 40px; margin-bottom: 10px;">❌</div>
                <div class="savefast-status-title" style="color: #ef4444;">Processing Failed</div>
                <div class="savefast-status-subtitle" style="color: #fca5a5;">${errorMsg || 'An error occurred during processing.'}</div>
                <button type="button" class="savefast-btn-reset" onclick="window.SaveFastToolUI.reset('${containerEl.id || 'file-drop-zone'}')">
                    🔄 Try Again
                </button>
            </div>
        `;
    },

    reset: function(containerId) {
        const el = document.getElementById(containerId || 'file-drop-zone') || document.querySelector('.drop-zone');
        if (el && el.dataset.origHtml) {
            el.innerHTML = el.dataset.origHtml;
        }
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
        const fileList = document.getElementById('file-list');
        if (fileList) fileList.innerHTML = '';
        const processButton = document.getElementById('process-button') || document.getElementById('convert-btn');
        if (processButton) processButton.disabled = true;
        const statusArea = document.getElementById('status-area');
        if (statusArea) statusArea.textContent = '';
    }
};

// Global automatic hook for all tools site-wide
(function() {
    // Auto-sync PDF.js worker version with loaded PDF.js API version
    function syncPdfJsWorker() {
        if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
            const ver = pdfjsLib.version || '2.11.338';
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${ver}/pdf.worker.min.js`;
        }
    }
    syncPdfJsWorker();
    document.addEventListener('DOMContentLoaded', syncPdfJsWorker);

    function getDropZone() {
        return document.getElementById('file-drop-zone') || document.querySelector('.drop-zone');
    }

    // Override global downloadFile function if any tool script calls it
    const origDownloadFile = window.downloadFile;
    window.downloadFile = function(data, fileName, mimeType) {
        const dropZone = getDropZone();
        if (dropZone) {
            window.SaveFastToolUI.showSuccess(dropZone, data, fileName, mimeType);
        } else if (origDownloadFile) {
            origDownloadFile(data, fileName, mimeType);
        } else {
            const blob = (data instanceof Blob) ? data : new Blob([data], { type: mimeType || 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.id = 'savefast-download-btn';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    // Global interception for ALL programmatic a.click() calls on download anchors (Prevents frontend auto-download!)
    const origAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function() {
        // If this is the user clicking our manual download button, allow normal download!
        if (this.id === 'savefast-download-btn' || this.classList.contains('savefast-btn-download')) {
            return origAnchorClick.apply(this, arguments);
        }

        // If this anchor has a 'download' attribute, it's an auto-download attempt from a tool script!
        if (this.hasAttribute('download') || this.download) {
            const dropZone = getDropZone();
            const fileName = this.getAttribute('download') || this.download || 'converted-document.pdf';
            const href = this.href;

            if (dropZone && href) {
                // Prevent auto download!
                if (href.startsWith('blob:')) {
                    fetch(href)
                        .then(res => res.blob())
                        .then(blob => {
                            window.SaveFastToolUI.showSuccess(dropZone, blob, fileName);
                        })
                        .catch(() => {
                            window.SaveFastToolUI.showSuccess(dropZone, href, fileName);
                        });
                } else {
                    window.SaveFastToolUI.showSuccess(dropZone, href, fileName);
                }
                return; // STOP THE AUTO DOWNLOAD!
            }
        }

        return origAnchorClick.apply(this, arguments);
    };

    // Sync #status-area updates to progress animation subtitle in real time
    document.addEventListener('DOMContentLoaded', () => {
        const statusArea = document.getElementById('status-area');
        if (statusArea) {
            const observer = new MutationObserver(() => {
                const text = statusArea.textContent ? statusArea.textContent.trim() : '';
                const sub = document.getElementById('savefast-proc-subtitle');
                if (sub && text && !text.includes('ready for download') && !text.includes('Conversion successful')) {
                    sub.textContent = text;
                }
            });
            observer.observe(statusArea, { childList: true, characterData: true, subtree: true });
        }
    });

    // Delay blob URL revocation so user can click manual download button without broken URLs
    const origRevokeObjectURL = URL.revokeObjectURL;
    URL.revokeObjectURL = function(url) {
        setTimeout(() => {
            try { origRevokeObjectURL.call(URL, url); } catch(e) {}
        }, 120000); // 2 minute delay
    };

    // Listen for form submit or button clicks site-wide across all tools
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('#process-button, #convert-btn, #generate-btn, .process-btn, .btn-convert, .tool-action-btn');
        if (btn && !btn.disabled) {
            const dropZone = getDropZone();
            if (dropZone && !dropZone.querySelector('.savefast-processing-box') && !dropZone.querySelector('.savefast-success-box')) {
                window.SaveFastToolUI.showProcessing(dropZone, '⚙️ Processing Document...', 'Applying formatting and generating output');
            }
        }
    }, true);

    document.addEventListener('submit', function(e) {
        const dropZone = getDropZone();
        if (dropZone && !dropZone.querySelector('.savefast-processing-box') && !dropZone.querySelector('.savefast-success-box')) {
            window.SaveFastToolUI.showProcessing(dropZone, '📤 Uploading to Server...', 'Processing document on server');
        }
    }, true);
})();

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const toolsGrid = document.querySelector('.tools-grid') || document.getElementById('tools-grid-container');

    // Live search filtering on the active page if toolsGrid is present
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim().toLowerCase();
            const cards = document.querySelectorAll('.tool-card');
            
            if (cards.length > 0) {
                cards.forEach(card => {
                    const title = card.querySelector('h2')?.textContent.toLowerCase() || '';
                    const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
                    if (title.includes(searchTerm) || desc.includes(searchTerm)) {
                        card.style.display = 'flex';
                        card.style.opacity = '1';
                    } else {
                        card.style.display = 'none';
                        card.style.opacity = '0';
                    }
                });
            }
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = e.target.value.trim();
                if (searchTerm && !window.location.pathname.endsWith('tools.html')) {
                    window.location.href = `tools.html?q=${encodeURIComponent(searchTerm)}`;
                }
            }
        });
    }

    // FAQ Accordion click interaction
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            const p = item.querySelector('p');
            if (p) {
                const isHidden = p.style.display === 'none';
                p.style.display = isHidden ? 'block' : 'none';
            }
        });
    });

    // Drag and Drop Zone visual pulse feedback
    const dropZone = document.getElementById('file-drop-zone');
    if (dropZone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('dragover');
            }, false);
        });
    }

    function createToolCard(tool) {
        const toolData = {
            'GIF to PDF': { color: 'linear-gradient(135deg, #f59e0b, #d97706)', icon: '<svg viewBox="0 0 24 24"><path d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z" /></svg>', desc: 'Transform animated GIFs into static PDF files.' },
            'TIFF to PDF': { color: 'linear-gradient(135deg, #f59e0b, #d97706)', icon: '<svg viewBox="0 0 24 24"><path d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z" /></svg>', desc: 'Convert multi-page TIFF images to searchable PDF.' },
            'BMP to PDF': { color: 'linear-gradient(135deg, #f59e0b, #d97706)', icon: '<svg viewBox="0 0 24 24"><path d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z" /></svg>', desc: 'Convert BMP bitmap graphics into crisp PDF files.' },
            'Word to PDF': { color: 'linear-gradient(135deg, #2563eb, #1d4ed8)', icon: '<svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,3.5L18.5,9H13V3.5Z" /></svg>', desc: 'Convert Word DOCX files to professional PDF.' },
            'PowerPoint to PDF': { color: 'linear-gradient(135deg, #ea580c, #c2410c)', icon: '<svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,3.5L18.5,9H13V3.5Z" /></svg>', desc: 'Convert PowerPoint PPTX slides to PDF presentations.' },
            'Excel to PDF': { color: 'linear-gradient(135deg, #10b981, #047857)', icon: '<svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,3.5L18.5,9H13V3.5Z" /></svg>', desc: 'Convert Excel spreadsheets into structured PDF tables.' },
            'JPG to PDF': { color: 'linear-gradient(135deg, #f59e0b, #ef4444)', icon: '<svg viewBox="0 0 24 24"><path d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z" /></svg>', desc: 'Combine JPG images into a single clean PDF.' },
            'PNG to PDF': { color: 'linear-gradient(135deg, #f59e0b, #ec4899)', icon: '<svg viewBox="0 0 24 24"><path d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z" /></svg>', desc: 'Convert PNG images with transparency to PDF.' },
            'PDF to JPG': { color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', icon: '<svg viewBox="0 0 24 24"><path d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z" /></svg>', desc: 'Extract pages from PDF into high-res JPG images.' },
            'PDF to Word': { color: 'linear-gradient(135deg, #2563eb, #1d4ed8)', icon: '<svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,3.5L18.5,9H13V3.5Z" /></svg>', desc: 'Convert PDF into editable Microsoft Word document.' },
            'Merge PDF': { color: 'linear-gradient(135deg, #ef4444, #b91c1c)', icon: '<svg viewBox="0 0 24 24"><path d="M8,2H16V8H22V16H16V22H8V16H2V8H8V2M10,4V8H4V14H10V10H14V14H20V8H14V4H10Z" /></svg>', desc: 'Combine multiple PDF files into one master document.' },
            'Split PDF': { color: 'linear-gradient(135deg, #ef4444, #dc2626)', icon: '<svg viewBox="0 0 24 24"><path d="M14,2H6V8H14V2M20,10H4V16H20V10M14,18H6V22H14V18Z" /></svg>', desc: 'Separate PDF pages or extract custom page ranges.' },
            'Compress PDF': { color: 'linear-gradient(135deg, #10b981, #059669)', icon: '<svg viewBox="0 0 24 24"><path d="M4,14H8V20H10V14H14V12H4V14M20,10H16V4H14V10H10V12H20V10Z" /></svg>', desc: 'Reduce PDF file size without sacrificing quality.' }
        };

        const data = toolData[tool.title] || { 
            color: 'linear-gradient(135deg, #4f46e5, #7c3aed)', 
            icon: '<svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,3.5L18.5,9H13V3.5Z" /></svg>', 
            desc: tool.description || '' 
        };

        const slug = tool.href ? tool.href.replace('.html', '') : tool.title.toLowerCase().replace(/[^a-z0-0]+/g, '-');
        const iconSrc = `tool-icons/${slug}.svg`;

        const a = document.createElement('a');
        a.href = tool.href;
        a.className = 'tool-card';
        a.innerHTML = `
            <div class="tool-visual-wrapper">
                <img src="${iconSrc}" alt="${tool.title} tool illustration" class="tool-visual-img" loading="lazy" width="170" height="140" />
            </div>
            <h2>${tool.title}</h2>
            <p>${data.desc}</p>
        `;

        return a;
    }

    // Recommended Tools Container Population
    const recommendedContainer = document.getElementById('recommended-tools');
    if (recommendedContainer && typeof tools !== 'undefined') {
        let currentToolHref = window.location.pathname.split('/').pop() || 'index.html';
        if (currentToolHref && !currentToolHref.endsWith('.html')) {
            currentToolHref += '.html';
        }

        const currentTool = tools.find(t => 
            t.href.toLowerCase() === currentToolHref.toLowerCase() ||
            t.href.replace('.html', '').toLowerCase() === currentToolHref.replace('.html', '').toLowerCase()
        );

        let recommended = [];
        if (currentTool) {
            recommended = tools.filter(t => t.category === currentTool.category && t.href !== currentTool.href);
        }

        // Robust Fallback: If category has fewer than 6 tools, fill up with other popular tools
        if (recommended.length < 6) {
            const currentHref = currentTool ? currentTool.href : currentToolHref;
            const extra = tools.filter(t => t.href !== currentHref && !recommended.includes(t));
            recommended = [...recommended, ...extra].slice(0, 6);
        } else {
            recommended = recommended.slice(0, 6);
        }

        recommendedContainer.innerHTML = '';
        recommended.forEach(tool => {
            const toolCard = createToolCard(tool);
            recommendedContainer.appendChild(toolCard);
        });
    }

    // --- Theme Switcher System ---
    function initThemeToggle() {
        const savedTheme = localStorage.getItem('pdf_savefast_theme') || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', savedTheme);

        const nav = document.querySelector('.main-nav');
        if (nav && !document.getElementById('theme-toggle-btn')) {
            const themeBtn = document.createElement('button');
            themeBtn.id = 'theme-toggle-btn';
            themeBtn.className = 'theme-toggle-btn';
            themeBtn.title = 'Toggle Light/Dark Theme';
            themeBtn.setAttribute('aria-label', 'Toggle Light/Dark Theme');
            themeBtn.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';

            themeBtn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('pdf_savefast_theme', newTheme);
                themeBtn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
            });

            nav.appendChild(themeBtn);
        }
    }

    // --- Inject Ambient Background Layer ---
    function initAmbientBackground() {
        if (!document.querySelector('.bg-ambient-container')) {
            const bgContainer = document.createElement('div');
            bgContainer.className = 'bg-ambient-container';
            bgContainer.innerHTML = `
                <div class="ambient-orb ambient-orb-1"></div>
                <div class="ambient-orb ambient-orb-2"></div>
                <div class="ambient-orb ambient-orb-3"></div>
                <div class="ambient-grid-pattern"></div>
            `;
            document.body.prepend(bgContainer);
        }
    }

    // --- Load Global Admin Configuration ---
    if (!window.SaveFastAdminConfigEngineLoaded && !document.getElementById('savefast-admin-config-script')) {
        const configScript = document.createElement('script');
        configScript.id = 'savefast-admin-config-script';
        const isSubdir = window.location.pathname.includes('/admin/');
        configScript.src = isSubdir ? '../admin-config.js' : 'admin-config.js';
        document.head.appendChild(configScript);
    }

    initThemeToggle();
    initAmbientBackground();
});
