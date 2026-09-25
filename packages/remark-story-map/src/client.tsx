import { createRoot, type Root } from 'react-dom/client';
import { StoryMap } from '@story-map/react-story-map';
import type { StoryMapConfig } from '@story-map/story-map-core';
import 'leaflet/dist/leaflet.css';
import '@story-map/react-story-map/styles.css';

const roots = new WeakMap<Element, Root>();

export function mountStoryMaps(scope: ParentNode = document) {
  const hosts = scope.querySelectorAll<HTMLElement>('[data-story-map-config]');

  hosts.forEach((host) => {
    if (roots.has(host)) return;
    const raw = host.dataset.storyMapConfig;
    if (!raw) return;

    try {
      const story = JSON.parse(decodeURIComponent(raw)) as StoryMapConfig;
      const root = createRoot(host);
      root.render(<StoryMap story={story} />);
      roots.set(host, root);
    } catch (error) {
      host.textContent = error instanceof Error ? `StoryMap error: ${error.message}` : 'StoryMap error';
    }
  });
}

export function startStoryMapClient() {
  if (typeof document === 'undefined') return () => {};

  const mount = () => mountStoryMaps(document);
  mount();
  const observer = new MutationObserver(mount);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => startStoryMapClient(), { once: true });
  } else {
    startStoryMapClient();
  }
}
