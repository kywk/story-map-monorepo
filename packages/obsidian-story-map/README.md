# Obsidian Story Map

MVP adapter for rendering `storymap` fenced blocks in Obsidian Reading View.

Build:

```bash
pnpm --filter @story-map/obsidian-story-map build
```

Copy `dist/main.js`, `dist/manifest.json`, and `dist/styles.css` into:

```text
<Vault>/.obsidian/plugins/story-map/
```

The adapter resolves `note: "[[Some Note]]"` from the current Vault and uses frontmatter as fallback content before rendering with `@story-map/react-story-map`.
