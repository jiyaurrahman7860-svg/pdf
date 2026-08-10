/**
 * SaveFast PDF - Global Admin Configuration & Real-Time Sync Engine
 * Guarantees 100% frontend action whenever admin changes tool status or settings.
 * Handles Active, Maintenance Mode, Disabled/Offline statuses, badges, support email & announcements.
 */
(function() {
    if (window.SaveFastAdminConfigEngineLoaded) return;
    window.SaveFastAdminConfigEngineLoaded = true;

    const DEFAULT_CONFIG = {
        supportEmail: 'support@savefast.in',
        supportPhone: '+91 98765 43210',
        supportResponseTime: '< 2 Hours',
        announcement: {
            enabled: true,
            text: '🎉 New: Interactive PDF Text Editing is now live! Select and edit PDF text directly.',
            type: 'promo', // 'info', 'success', 'warning', 'promo'
            link: 'edit-pdf-text.html',
            dismissible: true
        },
        toolsConfig: {},
        gaTrackingId: '',
        customHeadScript: '',
        customFooterScript: ''
    };

    let isUpdatingDOM = false;
    let observer = null;
    let observerDebounceTimer = null;

    // Helper: Normalize any href or URL path to standard file key e.g. "jpg-to-pdf.html"
    function normalizeHref(href) {
        if (!href) return '';
        let clean = href.split('/').pop().split('?')[0].split('#')[0].toLowerCase();
        if (!clean) return '';
        if (!clean.endsWith('.html')) clean += '.html';
        return clean;
    }

    function getConfig() {
        try {
            const saved = localStorage.getItem('savefast_admin_config');
            if (saved) {
                return Object.assign({}, DEFAULT_CONFIG, JSON.parse(saved));
            }
        } catch (e) {
            console.warn('Error parsing SaveFast admin config:', e);
        }
        return DEFAULT_CONFIG;
    }

    function getToolConfig(toolsConfig, href) {
        const norm = normalizeHref(href);
        if (!toolsConfig || !norm) return { status: 'active', badge: 'none' };

        for (let key in toolsConfig) {
            if (normalizeHref(key) === norm) {
                return toolsConfig[key] || { status: 'active', badge: 'none' };
            }
        }
        return { status: 'active', badge: 'none' };
    }

    function applyAdminConfig() {
        if (isUpdatingDOM) return;
        isUpdatingDOM = true;

        if (observer) {
            observer.disconnect();
        }

        try {
            const config = getConfig();
            window.SaveFastAdminConfig = config;

            // 1. Apply Support Email & Contact Info Site-Wide
            if (config.supportEmail) {
                document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
                    if (link.href !== `mailto:${config.supportEmail}`) {
                        link.href = `mailto:${config.supportEmail}`;
                    }
                    if (link.textContent.includes('@') && link.textContent !== config.supportEmail) {
                        link.textContent = config.supportEmail;
                    }
                });

                document.querySelectorAll('.support-email-text, #support-email-display').forEach(el => {
                    if (el.textContent !== config.supportEmail) {
                        el.textContent = config.supportEmail;
                    }
                });
            }

            // 2. Render / Update Global Announcement Banner Real-Time
            const existingBanner = document.getElementById('savefast-announcement-banner');
            if (config.announcement && config.announcement.enabled) {
                const isDismissed = sessionStorage.getItem('savefast_announcement_dismissed');
                if (!isDismissed) {
                    if (!existingBanner) {
                        renderAnnouncementBanner(config.announcement);
                    }
                } else if (existingBanner) {
                    existingBanner.remove();
                }
            } else if (existingBanner) {
                existingBanner.remove();
            }

            // 3. Sync & Enforce Tool Statuses on Tool Cards (Active / Maintenance / Disabled)
            applyToolCardStatuses(config.toolsConfig || {});

            // 4. Enforce Page-Level Status on Tool Pages
            applyToolPageStatus(config.toolsConfig || {});
        } catch (err) {
            console.error('Error applying SaveFast admin config:', err);
        } finally {
            isUpdatingDOM = false;
            if (observer && document.body) {
                try {
                    observer.observe(document.body, { childList: true, subtree: true });
                } catch(e) {}
            }
        }
    }

    function applyToolCardStatuses(toolsConfig) {
        const cards = document.querySelectorAll('.tool-card');
        if (!cards || cards.length === 0) return;

        cards.forEach(card => {
            const rawHref = card.getAttribute('href');
            if (!rawHref) return;

            const tCfg = getToolConfig(toolsConfig, rawHref);
            const status = tCfg.status || 'active'; // 'active', 'maintenance', 'disabled'
            const badge = tCfg.badge || 'none';

            if (card.dataset.appliedStatus === status && card.dataset.appliedBadge === badge) {
                return;
            }
            card.dataset.appliedStatus = status;
            card.dataset.appliedBadge = badge;

            // Reset initial card attributes
            card.classList.remove('tool-maintenance', 'tool-disabled');
            if (!card.dataset.origDisplay) {
                card.dataset.origDisplay = getComputedStyle(card).display || 'flex';
            }
            card.style.display = card.dataset.origDisplay;
            card.style.opacity = '';

            // Clean existing admin badges/overlays
            const oldBadge = card.querySelector('.tool-admin-badge');
            if (oldBadge) oldBadge.remove();
            const oldOverlay = card.querySelector('.tool-maintenance-overlay');
            if (oldOverlay) oldOverlay.remove();

            // Clear custom click handler if re-activated
            card.onclick = null;

            // Handle Statuses
            if (status === 'disabled') {
                card.style.display = 'none'; // Completely hide disabled tools from grid
                card.classList.add('tool-disabled');
            } else if (status === 'maintenance') {
                card.classList.add('tool-maintenance');
                card.style.opacity = '0.85';
                card.style.position = 'relative';

                const overlay = document.createElement('div');
                overlay.className = 'tool-maintenance-overlay';
                overlay.style.cssText = `
                    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.88);
                    backdrop-filter: blur(4px);
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    color: #fbbf24; font-weight: 800; font-size: 13px; z-index: 10;
                    border-radius: var(--radius-lg, 12px); text-align: center; padding: 12px;
                    border: 2px solid #d97706; box-shadow: inset 0 0 20px rgba(245,158,11,0.2);
                `;
                overlay.innerHTML = `
                    <div style="font-size: 24px; margin-bottom: 4px;">🛠️</div>
                    <span style="font-size: 14px; color: #fbbf24;">Under Maintenance</span>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 500; margin-top: 2px;">Check back soon</span>
                `;
                card.appendChild(overlay);

                // Intercept click on maintenance tool card
                card.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('🛠️ This tool is currently undergoing scheduled maintenance. Please check back shortly!');
                    return false;
                };
            }

            // Handle Badges for Active Tools
            if (badge && badge !== 'none' && status === 'active') {
                const badgeEl = document.createElement('div');
                badgeEl.className = 'tool-admin-badge';
                let badgeText = 'HOT';
                let bg = 'linear-gradient(135deg, #ef4444, #f59e0b)';
                if (badge === 'featured') { badgeText = '⭐ FEATURED'; bg = 'linear-gradient(135deg, #6366f1, #a855f7)'; }
                else if (badge === 'new') { badgeText = '🆕 NEW'; bg = 'linear-gradient(135deg, #10b981, #059669)'; }
                else if (badge === 'hot') { badgeText = '🔥 HOT'; bg = 'linear-gradient(135deg, #ef4444, #f59e0b)'; }

                badgeEl.style.cssText = `
                    position: absolute; top: 12px; right: 12px;
                    background: ${bg}; color: #ffffff;
                    padding: 4px 10px; border-radius: 50px;
                    font-size: 11px; font-weight: 800; letter-spacing: 0.5px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 5;
                `;
                badgeEl.textContent = badgeText;
                card.style.position = 'relative';
                card.appendChild(badgeEl);
            }
        });
    }

    function applyToolPageStatus(toolsConfig) {
        const currentFile = normalizeHref(window.location.pathname);
        if (!currentFile || currentFile === 'index.html' || currentFile === 'tools.html' || currentFile === 'admin.html') return;

        const tCfg = getToolConfig(toolsConfig, currentFile);
        const status = tCfg.status || 'active';

        if (status === 'active') return;

        const toolInterface = document.querySelector('.tool-interface') || document.querySelector('.tool-container') || document.querySelector('main');
        if (!toolInterface || toolInterface.dataset.statusApplied === status) return;

        toolInterface.dataset.statusApplied = status;

        if (status === 'disabled') {
            toolInterface.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; background: #0f172a; border-radius: 16px; border: 1px solid rgba(239,68,68,0.3); max-width: 600px; margin: 40px auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                    <div style="font-size: 56px; margin-bottom: 16px;">🔴</div>
                    <h2 style="color: #ef4444; font-size: 26px; font-weight: 800; margin-bottom: 12px;">Tool Currently Offline</h2>
                    <p style="color: #94a3b8; font-size: 15px; margin-bottom: 24px; line-height: 1.6;">This tool has been temporarily disabled by the administrator. Please select another active tool from our toolkit.</p>
                    <a href="tools.html" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 8px 20px rgba(79,70,229,0.3);">Browse Active Tools →</a>
                </div>
            `;
        } else if (status === 'maintenance') {
            toolInterface.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; background: #0f172a; border-radius: 16px; border: 1px solid rgba(245,158,11,0.3); max-width: 600px; margin: 40px auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                    <div style="font-size: 56px; margin-bottom: 16px;">🛠️</div>
                    <h2 style="color: #fbbf24; font-size: 26px; font-weight: 800; margin-bottom: 12px;">Scheduled Maintenance</h2>
                    <p style="color: #cbd5e1; font-size: 15px; margin-bottom: 24px; line-height: 1.6;">This tool is currently undergoing updates to improve performance and features. Please check back shortly!</p>
                    <a href="tools.html" style="background: #334155; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block;">View All Tools</a>
                </div>
            `;
        }
    }

    function renderAnnouncementBanner(ann) {
        const banner = document.createElement('div');
        banner.id = 'savefast-announcement-banner';
        banner.className = `savefast-announcement banner-${ann.type || 'info'}`;
        banner.style.cssText = `
            background: ${ann.type === 'promo' ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : ann.type === 'warning' ? '#d97706' : ann.type === 'success' ? '#059669' : '#2563eb'};
            color: #ffffff;
            padding: 10px 16px;
            text-align: center;
            font-size: 13.5px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            position: relative;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        let html = `<span>${ann.text}</span>`;
        if (ann.link) {
            html += `<a href="${ann.link}" style="color: #ffffff; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 50px; text-decoration: none; font-size: 12px; transition: background 0.2s;">Try Now →</a>`;
        }
        if (ann.dismissible) {
            html += `<button type="button" id="savefast-banner-close" style="background: none; border: none; color: #ffffff; font-size: 18px; cursor: pointer; padding: 0 4px; margin-left: 10px;">&times;</button>`;
        }

        banner.innerHTML = html;
        document.body.prepend(banner);

        const closeBtn = document.getElementById('savefast-banner-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                banner.remove();
                sessionStorage.setItem('savefast_announcement_dismissed', 'true');
            });
        }
    }

    // REAL-TIME CROSS-TAB SYNC EVENT LISTENER
    window.addEventListener('storage', (e) => {
        if (e.key === 'savefast_admin_config') {
            applyAdminConfig();
        }
    });

    // MutationObserver to automatically detect dynamically added tool cards
    observer = new MutationObserver((mutations) => {
        if (isUpdatingDOM) return;

        let containsToolCard = false;
        for (let mutation of mutations) {
            for (let node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    if (node.classList && (node.classList.contains('tool-card') || node.classList.contains('tools-grid') || node.id === 'recommended-tools' || node.querySelector?.('.tool-card'))) {
                        if (!node.classList.contains('tool-admin-badge') && !node.classList.contains('tool-maintenance-overlay') && node.id !== 'savefast-announcement-banner') {
                            containsToolCard = true;
                            break;
                        }
                    }
                }
            }
            if (containsToolCard) break;
        }

        if (containsToolCard) {
            clearTimeout(observerDebounceTimer);
            observerDebounceTimer = setTimeout(() => {
                applyAdminConfig();
            }, 100);
        }
    });

    function init() {
        applyAdminConfig();
        if (document.body && observer) {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
