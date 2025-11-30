import ReactDOM from 'react-dom/client';
import WatchLaterHome from '../components/WatchLaterHome';
import '../components/WatchLaterHome.css';

export default defineContentScript({
  matches: ['https://www.youtube.com/*'],
  // cssInjectionMode: 'ui', // Removed to allow auto injection
  async main(ctx) {
    const mountWatchLater = () => {
      if (window.location.pathname === '/') {
        const target = document.querySelector('ytd-rich-grid-renderer') || document.querySelector('#primary');
        if (target) {
          // Clear existing content but keep the container
          target.innerHTML = '';
          const appContainer = document.createElement('div');
          appContainer.id = 'wl-extension-root';
          target.appendChild(appContainer);

          const root = ReactDOM.createRoot(appContainer);
          root.render(<WatchLaterHome />);
          return true;
        }
      }
      return false;
    };

    // Initial check
    // Wait for element to appear
    const observer = new MutationObserver(() => {
      if (window.location.pathname === '/') {
        const target = document.querySelector('ytd-rich-grid-renderer');
        if (target && !document.getElementById('wl-extension-root')) {
          mountWatchLater();
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Handle SPA navigation
    window.addEventListener('yt-navigate-finish', () => {
      if (window.location.pathname === '/') {
        // Re-check if our app is there, if not mount it
        if (!document.getElementById('wl-extension-root')) {
          // We might need to wait for YouTube to render the grid again before we wipe it
          setTimeout(mountWatchLater, 500);
        }
      }
    });

    // Also try immediately
    mountWatchLater();
  },
});

