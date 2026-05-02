// Shared in-site notification helper for all pages
(function() {
  const containerId = 'notification-container';
  function createContainer() {
    const container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '10000';
    container.style.maxWidth = '320px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'flex-end';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
    return container;
  }

  function ensureContainer() {
    let container = document.getElementById(containerId);
    if (!container) {
      if (!document.body) {
        return null;
      }
      container = createContainer();
    }
    return container;
  }

  function getThemeStyles() {
    const theme = localStorage.getItem('siteTheme') || 'dark';
    if (theme === 'light') {
      return {
        background: 'rgba(245,246,250,0.98)',
        color: '#111',
        border: '1px solid rgba(77,163,255,0.3)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
        progress: 'linear-gradient(90deg, #4da3ff, #2563eb)'
      };
    }
    if (theme === 'neon') {
      return {
        background: 'rgba(28,8,48,0.96)',
        color: '#fff',
        border: '1px solid rgba(255,0,255,0.45)',
        boxShadow: '0 0 32px rgba(255,0,255,0.25), inset 0 0 16px rgba(255,0,255,0.08)',
        progress: 'linear-gradient(90deg, #ff00ff, #00ffff)'
      };
    }
    return {
      background: 'rgba(20,24,38,0.96)',
      color: '#fff',
      border: '1px solid rgba(77,163,255,0.3)',
      boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
      progress: 'linear-gradient(90deg, #4da3ff, #7dd3fc)'
    };
  }

  function showSiteNotification(title, body, duration = 5000) {
    const container = ensureContainer();
    if (!container) {
      document.addEventListener('DOMContentLoaded', () => showSiteNotification(title, body, duration), { once: true });
      return;
    }
    const notif = document.createElement('div');
    notif.className = 'site-notification';
    notif.style.pointerEvents = 'auto';
    notif.style.width = '100%';
    notif.style.maxWidth = '320px';
    notif.style.padding = '16px 18px';
    notif.style.borderRadius = '16px';
    notif.style.marginTop = '10px';
    notif.style.position = 'relative';
    notif.style.overflow = 'hidden';
    notif.style.transform = 'translateX(100px)';
    notif.style.opacity = '0';
    notif.style.transition = 'transform 0.35s ease-out, opacity 0.35s ease-out';

    const theme = getThemeStyles();
    notif.style.background = theme.background;
    notif.style.color = theme.color;
    notif.style.border = theme.border;
    notif.style.boxShadow = theme.boxShadow;

    notif.innerHTML = `
      <div style="font-weight:700; font-size:14px; margin-bottom:6px;">${title}</div>
      <div style="font-size:13px; line-height:1.5; opacity:0.92;">${body}</div>
      <div class="notif-progress" style="position:absolute; bottom:0; left:0; height:3px; width:100%; background:${theme.progress};"></div>
    `;

    container.appendChild(notif);

    requestAnimationFrame(() => {
      notif.style.transform = 'translateX(0)';
      notif.style.opacity = '1';
    });

    const progressBar = notif.querySelector('.notif-progress');
    if (progressBar) {
      progressBar.style.transition = `width ${duration}ms linear`;
      requestAnimationFrame(() => {
        progressBar.style.width = '0%';
      });
    }

    const hide = () => {
      notif.style.transform = 'translateX(100px)';
      notif.style.opacity = '0';
      notif.style.transition = 'transform 0.25s ease-in, opacity 0.25s ease-in';
      setTimeout(() => {
        if (notif.parentNode) notif.remove();
      }, 250);
    };

    const timer = setTimeout(hide, duration);
    notif.addEventListener('click', () => {
      clearTimeout(timer);
      hide();
    });
  }

  function handleStorageEvent(event) {
    if (!event.key || event.newValue === null) return;
    const settings = JSON.parse(localStorage.getItem('notifSettings') || '{}');

    if (event.key === 'siteAnnouncement') {
      if (!settings.announce) return;
      try {
        const data = JSON.parse(event.newValue);
        if (data && data.title && data.text) {
          showSiteNotification('📢 ' + data.title, data.text, 7000);
        }
      } catch (e) {
        // ignore invalid announcement data
      }
    }

    if (event.key === 'pollUpdate') {
      if (!settings.poll) return;
      try {
        const data = JSON.parse(event.newValue);
        if (data && data.message) {
          showSiteNotification('🗳️ Poll Update', data.message, 5000);
        }
      } catch (e) {
        // ignore invalid poll data
      }
    }

    if (event.key === 'badgeNotification') {
      if (!settings.badge) return;
      try {
        const data = JSON.parse(event.newValue);
        if (data && data.title && data.body) {
          showSiteNotification(data.title, data.body, 5000);
        }
      } catch (e) {
        // ignore invalid badge data
      }
    }
  }

  if (!window.showSiteNotification) {
    window.showSiteNotification = showSiteNotification;
  }
  if (!window.triggerNotification) {
    window.triggerNotification = function(title, body, duration) {
      showSiteNotification(title, body, duration);
    };
  }

  window.addEventListener('storage', handleStorageEvent);

  // Immediate display if announcement was set before this page loaded
  const initialAnn = localStorage.getItem('siteAnnouncement');
  if (initialAnn) {
    try {
      const data = JSON.parse(initialAnn);
      if (data && data.title && data.text) {
        window.setTimeout(() => {
          const settings = JSON.parse(localStorage.getItem('notifSettings') || '{}');
          if (settings.announce) {
            showSiteNotification('📢 ' + data.title, data.text, 7000);
          }
        }, 1500);
      }
    } catch (e) {
      // ignore invalid data
    }
  }
})();