/**
 * SaveFast PDF - Global Admin Configuration & Real-Time Sync Engine
 * Real-time sync across user panel & admin console tabs via localStorage events.
 * Manages Tool Statuses: Active & Online, Maintenance Mode, Disabled / Offline.
 */
(function() {
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
        toolsConfig: {
            'edit-pdf-text.html': { badge: 'hot', status: 'active' },
            'merge-pdf.html': { badge: 'featured', status: 'active' },
            'compress-pdf.html': { badge: 'hot', status: 'active' }
        },
        gaTrackingId: '',
        customHeadScript: '',
        customFooterScript: ''
    };

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

    function applyAdminConfig() {
        const config = getConfig();
        window.SaveFastAdminConfig = config;

        // 1. Apply Support Email & Contact Info Site-Wide
        if (config.supportEmail) {
            document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
                link.href = `mailto:${config.supportEmail}`;
                if (link.textContent.includes('@')) {
                    link.textContent = config.supportEmail;
                }
            });

            document.querySelectorAll('.support-email-text, #support-email-display').forEach(el => {
                el.textContent = config.supportEmail;
            });
        }

        // 2. Render / Update Global Announcement Banner Real-Time
        const existingBanner = document.getElementById('savefast-announcement-banner');
        if (config.announcement && config.announcement.enabled) {
            const isDismissed = sessionStorage.getItem('savefast_announcement_dismissed');
            if (!isDismissed) {
                if (existingBanner) existingBanner.remove();
                renderAnnouncementBanner(config.announcement);
            }
        } else if (existingBanner) {
            existingBanner.remove();
        }

        // 3. Sync & Enforce Tool Statuses on Tool Cards (Active / Maintenance / Disabled)
        applyToolCardStatuses(config.toolsConfig || {});

        // 4. Enforce Page-Level Status on Tool Pages
        applyToolPageStatus(config.toolsConfig || {});
    }

    function applyToolCardStatuses(toolsConfig) {
        const cards = document.querySelectorAll('.tool-card');
        if (!cards || cards.length === 0) return;

        cards.forEach(card => {
            const href = card.getAttribute('href');
            if (!href) return;

            const tCfg = toolsConfig[href] || {};
            const status = tCfg.status || 'active'; // 'active', 'maintenance', 'disabled'
            const badge = tCfg.badge || 'none';

            // Reset classes
            card.classList.remove('tool-maintenance', 'tool-disabled');
            card.style.display = '';
            card.style.opacity = '';

            // Remove existing admin overlays/badges
            const oldBadge = card.querySelector('.tool-admin-badge');
            if (oldBadge) oldBadge.remove();
            const oldOverlay = card.querySelector('.tool-maintenance-overlay');
            if (oldOverlay) oldOverlay.remove();

            // Handle 3-State Statuses
            if (status === 'disabled') {
                card.style.display = 'none'; // Completely hide disabled tools
                card.classList.add('tool-disabled');
            } else if (status === 'maintenance') {
                card.classList.add('tool-maintenance');
                card.style.opacity = '0.75';
                
                const overlay = document.createElement('div');
                overlay.className = 'tool-maintenance-overlay';
                overlay.style.cssText = `
                    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.85);
                    backdrop-filter: blur(4px);
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    color: #fbbf24; font-weight: 700; font-size: 13px; z-index: 10;
                    border-radius: var(--radius-lg, 12px); text-align: center; padding: 10px;
                `;
                overlay.innerHTML = `🛠️ <span>Under Maintenance</span>`;
                card.style.position = 'relative';
                card.appendChild(overlay);

                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    alert('This tool is currently undergoing scheduled maintenance. Please try again shortly.');
                }, { capture: true, once: true });
            }

            // Handle Badges
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
                    padding: 3px 10px; border-radius: 50px;
                    font-size: 11px; font-weight: 800; letter-spacing: 0.5px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index: 5;
                `;
                badgeEl.textContent = badgeText;
                card.style.position = 'relative';
                card.appendChild(badgeEl);
            }
        });
    }

    function applyToolPageStatus(toolsConfig) {
        const path = window.location.pathname.split('/').pop();
        if (!path || path === 'index.html' || path === 'tools.html' || path === 'admin.html') return;

        const tCfg = toolsConfig[path];
        if (!tCfg) return;

        const status = tCfg.status || 'active';
        const toolInterface = document.querySelector('.tool-interface');

        if (!toolInterface) return;

        if (status === 'disabled') {
            toolInterface.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔴</div>
                    <h2 style="color: #ef4444; margin-bottom: 12px;">Tool Currently Offline</h2>
                    <p style="color: #94a3b8; margin-bottom: 24px;">This tool has been temporarily disabled by the administrator.</p>
                    <a href="tools.html" class="editor-btn btn-success" style="padding: 10px 24px; text-decoration: none; display: inline-block;">Browse Active Tools →</a>
                </div>
            `;
        } else if (status === 'maintenance') {
            toolInterface.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🛠️</div>
                    <h2 style="color: #fbbf24; margin-bottom: 12px;">Scheduled Maintenance</h2>
                    <p style="color: #cbd5e1; margin-bottom: 24px;">This tool is currently undergoing updates to improve performance and features. Please check back shortly!</p>
                    <a href="tools.html" class="editor-btn" style="padding: 10px 24px; text-decoration: none; display: inline-block; background: #334155;">View All Tools</a>
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyAdminConfig);
    } else {
        applyAdminConfig();
    }
})();
