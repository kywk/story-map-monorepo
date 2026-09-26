import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { StoryMapConfig, StorySlide } from '@story-map/story-map-core';
import { StoryMap } from './StoryMap.js';

function config(slide: StorySlide): StoryMapConfig {
  return {
    schema: 'storymap/v1',
    height: '400px',
    map: {
      zoom: 3,
      tileUrl: 'https://tile.example/{z}/{x}/{y}.png',
      attribution: 'Example',
      showPath: false,
    },
    slides: [slide],
  };
}

describe('StoryMap slide title', () => {
  it('renders a plain heading when the slide has no notePath', () => {
    const html = renderToStaticMarkup(<StoryMap story={config({ title: 'Santiago' })} />);

    expect(html).toContain('Santiago');
    expect(html).not.toContain('<a ');
  });

  it('renders a plain browser link when notePath has no callbacks', () => {
    const html = renderToStaticMarkup(
      <StoryMap story={config({ title: 'Santiago', notePath: '/docs/santiago/' })} />,
    );

    expect(html).toContain('href="/docs/santiago/"');
    expect(html).toContain('story-map__note-link');
  });

  it('renders an anchor when notePath and onNoteClick are provided', () => {
    const html = renderToStaticMarkup(
      <StoryMap
        story={config({ title: 'Santiago', notePath: '/docs/santiago/' })}
        onNoteClick={() => {}}
      />,
    );

    expect(html).toContain('href="/docs/santiago/"');
    expect(html).toContain('story-map__note-link');
  });
});
