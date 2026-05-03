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
      background: 'rgba(30,34,44,0.94)',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 18px 45px rgba(0,0,0,0.26)',
      progress: 'linear-gradient(90deg, rgba(140,170,255,0.95), rgba(120,230,255,0.9))'
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

  function generatePresenceId() {
    const key = 'presenceId';
    let id = localStorage.getItem(key);
    if (!id) {
      id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + '_' + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  }

  let pendingOnlineCount = null;

  function createOnlineCountWidget() {
    if (!document.body) return null;
    let widget = document.getElementById('online-count-widget');
    if (widget) return widget;

    widget = document.createElement('div');
    widget.id = 'online-count-widget';
    widget.style.position = 'fixed';
    widget.style.bottom = '20px';
    widget.style.left = '20px';
    widget.style.zIndex = '10001';
    widget.style.background = 'rgba(255,255,255,0.08)';
    widget.style.color = '#e8e8e8';
    widget.style.padding = '10px 14px';
    widget.style.borderRadius = '14px';
    widget.style.border = '1px solid rgba(255,255,255,0.15)';
    widget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)';
    widget.style.fontSize = '13px';
    widget.style.fontWeight = '600';
    widget.style.backdropFilter = 'blur(15px)';
    widget.style.pointerEvents = 'none';
    widget.style.opacity = '0.9';
    widget.innerText = 'Online: …';

    document.body.appendChild(widget);
    return widget;
  }

  function whenBodyReady(callback) {
    if (document.body || document.readyState !== 'loading') {
      callback();
      return;
    }
    document.addEventListener('DOMContentLoaded', callback, { once: true });
  }

  function updateOnlineCountWidget(count) {
    const widget = createOnlineCountWidget();
    if (widget) {
      widget.innerText = `${count} ${count === 1 ? 'person' : 'people'} online`;
      return;
    }

    pendingOnlineCount = count;
    whenBodyReady(() => {
      const readyWidget = createOnlineCountWidget();
      if (readyWidget) {
        readyWidget.innerText = `${pendingOnlineCount} ${pendingOnlineCount === 1 ? 'person' : 'people'} online`;
      }
    });
  }

  function initOnlinePresence() {
    try {
      // Check if localStorage is available
      let storageAvailable = false;
      try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        storageAvailable = true;
      } catch (e) {
        console.warn('localStorage not available in this browser/context:', e);
      }

      if (!storageAvailable) {
        console.warn('Online presence disabled: localStorage not accessible');
        updateOnlineCountWidget(1); // At least show this user
        return;
      }

      const presenceId = generatePresenceId();
      const storageKey = 'presence_' + presenceId;
      
      const updatePresence = () => {
        try {
          localStorage.setItem(storageKey, JSON.stringify({
            id: presenceId,
            page: location.pathname,
            title: document.title,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Failed to update presence:', e);
        }
      };

      const removePresence = () => {
        try {
          localStorage.removeItem(storageKey);
        } catch (e) {
          // ignore cleanup errors
        }
      };

      const countOnlineUsers = () => {
        const now = Date.now();
        const maxAge = 90000; // 90 seconds
        let count = 0;
        const foundIds = [];

        try {
          // Safely iterate localStorage
          const keys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) keys.push(key);
          }

          const staleKeys = [];
          for (const key of keys) {
            if (key && key.startsWith('presence_')) {
              try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && data.timestamp && (now - data.timestamp) < maxAge) {
                  count++;
                  foundIds.push(key);
                } else {
                  staleKeys.push(key);
                }
              } catch (e) {
                // ignore malformed data
                staleKeys.push(key);
              }
            }
          }

          if (staleKeys.length > 0) {
            staleKeys.forEach((staleKey) => {
              try { localStorage.removeItem(staleKey); } catch (e) { /* ignore */ }
            });
          }

          if (foundIds.length > 0) {
            console.log('Online presence count:', count, 'IDs:', foundIds.slice(0, 3));
          }
        } catch (e) {
          console.warn('Error counting online users:', e);
          return 1; // Fallback: at least this user
        }

        return Math.max(count, 1); // Always at least 1 (current user)
      };

      // Initial update
      updatePresence();
      
      // Update every 25 seconds
      setInterval(updatePresence, 25000);

      // Count online users every 5 seconds
      const updateCounter = () => {
        const count = countOnlineUsers();
        updateOnlineCountWidget(count);
      };
      
      setInterval(updateCounter, 5000);
      
      // Initial count after small delay to ensure other tabs' data is present
      setTimeout(updateCounter, 100);

      // Also update on storage changes from other tabs
      const storageListener = (event) => {
        if (event.key && event.key.startsWith('presence_')) {
          updateCounter();
        }
      };
      
      window.addEventListener('storage', storageListener);

      // Fallback: Use BroadcastChannel API if available (better for cross-tab communication)
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const channel = new BroadcastChannel('snhoopys-hub-presence');
          channel.onmessage = (event) => {
            if (event.data && event.data.type === 'presence-update') {
              updateCounter();
            }
          };
          
          // Send presence updates via BroadcastChannel
          const originalUpdatePresence = updatePresence;
          setInterval(() => {
            originalUpdatePresence();
            channel.postMessage({ type: 'presence-update', id: presenceId });
          }, 25000);
          
          console.log('BroadcastChannel enabled for presence sync');
        } catch (e) {
          console.warn('BroadcastChannel failed, using localStorage only:', e);
        }
      }

      console.log('Online presence tracking initialized (localStorage-based)');
    } catch (err) {
      console.error('Online presence init failed:', err);
      updateOnlineCountWidget(1); // At least count this page
    }
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

  initOnlinePresence();
})();