# Extension architecture overview

BCX is a Chrome extension that enhances Bandcamp pages and shows music data in a side panel. The background service worker coordinates requests between the side panel, content scripts, and Chrome APIs.

```mermaid
flowchart TB
    subgraph tab[Bandcamp tab]
        page[Bandcamp page]
        content[Content script and injected UI]
        page <-->|Read and enhance| content
    end

    subgraph extension[Extension contexts]
        panel[Side panel]
        background[Background service worker]
        panel <-->|Requests and actions| background
    end

    subgraph browser[Chrome services]
        apis[Tabs, side panel, and history APIs]
        storage[Storage API]
    end

    content <-->|Messages| background
    background -->|Browser operations| apis
    content -->|Save music data| storage
    panel <-->|Read data and cache views| storage
```

The content scripts work within Bandcamp tabs. The side panel presents the collected data and sends page-related requests through the background service worker. Both use shared models and helpers, while Chrome storage keeps data available across extension contexts.
