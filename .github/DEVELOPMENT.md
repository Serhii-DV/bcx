# Development Guidelines for BCX

## Copilot AI Development Rules

When working with GitHub Copilot on this project, please follow these guidelines:

### Project Context

- This is a **Bandcamp browser extension** that enhances music discovery
- Built with **Svelte 5** (using runes), **TypeScript**, and **TailwindCSS v4**
- Uses **shadcn-svelte** component library for consistent UI
- Follows **Chrome Extension Manifest V3** standards

### Code Quality Standards

1. **Always use TypeScript** - No plain JavaScript files
2. **Follow Biome configuration** - Use `pnpm check` and `pnpm fix`
3. **Write tests** for utility functions and core logic
4. **Use Svelte 5 runes syntax** (`$state`, `$derived`, `$effect`)
5. **Prefer composition over inheritance**

### Component Development

- Use **shadcn-svelte components** as base building blocks
- Follow the existing component structure in `src/lib/components/`
- Keep components small and focused on single responsibilities
- Use **TailwindCSS utility classes** for styling
- Implement proper TypeScript interfaces for props

### Browser Extension Best Practices

- Respect **Content Security Policy** limitations
- Use proper **message passing** between content scripts and background
- Don't break Bandcamp's existing functionality
- Follow **minimal invasive design** principles
- Test in multiple browser environments

### File Organization

```txt
src/
├── bandcamp/          # Core integration logic
├── lib/components/    # Reusable UI components
├── utils/            # Tested utility functions
├── popup/            # Extension popup interface
└── background.ts     # Background script
```

### Testing Requirements

- Write **unit tests** for all utility functions
- Use **RSTest framework** (Jest-based)
- Test browser extension specific functionality
- Aim for **>80% code coverage** on business logic

### Performance Considerations

- Minimize **DOM manipulation** overhead
- Use **efficient Svelte reactivity** patterns
- Avoid **memory leaks** in content scripts
- Optimize for **fast extension startup**

### Git & Collaboration

- Use **conventional commits** format
- Create **feature branches** for new functionality
- Write **descriptive PR descriptions**
- Include **testing instructions** in PRs

## Common Patterns

### Svelte 5 Component Template

```svelte
<script lang="ts">
  interface Props {
    title: string;
    items?: string[];
  }

  let { title, items = [] }: Props = $props();

  let count = $state(0);
  let doubled = $derived(count * 2);
</script>

<div class="p-4 bg-background">
  <h2 class="text-xl font-semibold">{title}</h2>
  <!-- Component content -->
</div>
```

### Utility Function Template

```typescript
/**
 * Brief description of the function
 * @param param1 - Description
 * @returns Description of return value
 */
export function utilityFunction(param1: string): boolean {
  // Implementation
  return true;
}
```

### Chrome Extension Message Passing

```typescript
// Content script to background
chrome.runtime.sendMessage({
  action: 'actionName',
  data: payload
});

// Background script listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'actionName') {
    // Handle message
    sendResponse({ success: true });
  }
});
```
