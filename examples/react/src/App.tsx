import { StoryMap } from '@story-map/react-story-map';
import { parseStoryMapYaml } from '@story-map/story-map-core';
import { marathonStoryYaml } from './story.js';

const story = parseStoryMapYaml(marathonStoryYaml);

export default function App() {
  return (
    <main className="page">
      <header className="page__header">
        <h1>2025 世界七大馬拉松</h1>
        <p>Abbott World Marathon Majors，依舉辦時間排序。</p>
      </header>

      <StoryMap story={story} />

      <p className="page__hint">
        使用「上一站 / 下一站」或鍵盤左右方向鍵切換，地圖會自動飛往對應城市。
      </p>
    </main>
  );
}
