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
    let id = localStorage.getItem('presenceId');
    if (!id) {
      id = 'presence_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36);
      localStorage.setItem('presenceId', id);
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

  function updateOnlineCountWidget(count) {
    if (!document.body) {
      pendingOnlineCount = count;
      document.addEventListener('DOMContentLoaded', () => {
        const widget = createOnlineCountWidget();
        if (widget) widget.innerText = `${pendingOnlineCount} ${pendingOnlineCount === 1 ? 'person' : 'people'} online`;
      }, { once: true });
      return;
    }

    const widget = createOnlineCountWidget();
    if (widget) widget.innerText = `${count} ${count === 1 ? 'person' : 'people'} online`;
  }

  async function initOnlinePresence() {
    try {
      // Try to use existing Firebase if available (from main pages like index.html)
      if (window.firebase && window.firebase.firestore && window.firebase.auth) {
        const db = window.firebase.firestore();
        const auth = window.firebase.auth();
        
        // Try to sign in anonymously if not already signed in
        if (!auth.currentUser) {
          try {
            await auth.signInAnonymously();
          } catch (authErr) {
            console.warn('Anonymous auth failed:', authErr);
          }
        }

        const presenceId = generatePresenceId();
        const presenceRef = db.collection('presence').doc(presenceId);
        
        const updatePresence = () => {
          presenceRef.set({
            page: location.pathname,
            title: document.title,
            lastSeen: window.firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => console.warn('Presence update error:', err));
        };

        // Initial update
        updatePresence();
        
        // Update every 25 seconds
        setInterval(updatePresence, 25000);

        // Listen for active users (last 90 seconds)
        db.collection('presence')
          .where('lastSeen', '>', new Date(Date.now() - 90000))
          .onSnapshot(
            snap => {
              updateOnlineCountWidget(snap.size);
              console.log('Online count updated:', snap.size);
            },
            err => console.warn('Presence listener error:', err)
          );
      } else {
        // Fallback: try dynamic import
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, doc, collection, setDoc, query, where, onSnapshot, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const { getAuth, signInAnonymously } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        
        const firebaseConfig = {
          apiKey: "AIzaSyA2qokCt--RrebnKxF7qfn5pHW5_R27SkM",
          authDomain: "snoopys-hub.firebaseapp.com",
          projectId: "snoopys-hub",
          storageBucket: "snoopys-hub.appspot.com",
          messagingSenderId: "711107016273",
          appId: "1:711107016273:web:c0680189aa61f6b9052a70"
        };

        let app;
        try {
          app = initializeApp(firebaseConfig);
        } catch (e) {
          // App already initialized
          app = window.firebase && window.firebase.app ? window.firebase.app() : null;
        }

        if (!app) {
          console.warn('Could not initialize Firebase');
          return;
        }

        const auth = getAuth(app);
        const db = getFirestore(app);

        try {
          await signInAnonymously(auth);
        } catch (authErr) {
          console.warn('Anonymous auth failed:', authErr);
        }

        const presenceId = generatePresenceId();
        const presenceDocRef = doc(collection(db, 'presence'), presenceId);
        
        const updatePresence = async () => {
          try {
            await setDoc(presenceDocRef, {
              page: location.pathname,
              title: document.title,
              lastSeen: serverTimestamp(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (err) {
            console.warn('Presence update error:', err);
          }
        };

        // Initial update
        await updatePresence();
        
        // Update every 25 seconds
        setInterval(updatePresence, 25000);

        // Listen for active users (last 90 seconds)
        const q = query(
          collection(db, 'presence'),
          where('lastSeen', '>', new Date(Date.now() - 90000))
        );
        
        onSnapshot(q, snap => {
          updateOnlineCountWidget(snap.size);
          console.log('Online count updated:', snap.size);
        });
      }
    } catch (err) {
      console.error('Online presence init failed:', err);
      // Still show the widget even on error
      updateOnlineCountWidget(0);
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