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
            'PDF to JPG': { color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', icon: '<svg viewBox="0 0 24 24"><path d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z" /></svg>', desc: 'Extract pages from PDF into high-res JPG images.' },
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

    initThemeToggle();
    initAmbientBackground();
});
