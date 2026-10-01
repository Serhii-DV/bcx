let nextPopoverId = 0;

/** A compact keyword picker for one release. */
export class KeywordBadges {
  readonly element = document.createElement('div');
  private readonly trigger = document.createElement('button');
  private readonly popover = document.createElement('div');
  private readonly events = new AbortController();
  private openEvents: AbortController | null = null;

  constructor(
    keywords: string[],
    createBadge: (keyword: string) => HTMLElement,
  ) {
    this.element.className = 'bcx-keywords';
    this.element.setAttribute('role', 'group');
    this.element.setAttribute('aria-label', 'Release keywords');

    this.trigger.type = 'button';
    this.trigger.className = 'bcx-badge bcx-badge-keyword bcx-keywords-trigger';
    this.trigger.textContent = `+${keywords.length} ${keywords.length === 1 ? 'keyword' : 'keywords'}`;
    this.trigger.setAttribute(
      'aria-label',
      `Show ${keywords.length} release keywords`,
    );
    this.popover.id = `bcx-keywords-${nextPopoverId++}`;
    this.popover.className = 'bcx-keyword-popover';
    this.popover.popover = 'auto';
    this.popover.setAttribute('role', 'dialog');
    this.popover.setAttribute('aria-label', 'All release keywords');
    this.trigger.popoverTargetElement = this.popover;

    const heading = document.createElement('strong');
    heading.className = 'bcx-keyword-popover-heading';
    heading.textContent = 'Keywords';
    this.popover.appendChild(heading);
    keywords.forEach((keyword, index) => {
      const badge = createBadge(keyword);
      if (index === 0) badge.autofocus = true;
      badge.addEventListener('click', () => this.popover.hidePopover(), {
        signal: this.events.signal,
      });
      this.popover.appendChild(badge);
    });
    this.element.append(this.trigger, this.popover);

    this.popover.addEventListener(
      'beforetoggle',
      (event) => {
        if (event.newState !== 'open') return;
        this.updatePopoverSurface();
        // Measure without painting, before the native popover becomes visible.
        this.popover.classList.add('bcx-keyword-popover-measuring');
        const width = this.popover.offsetWidth;
        const height = this.popover.offsetHeight;
        this.popover.classList.remove('bcx-keyword-popover-measuring');
        this.setPopoverPosition(width, height);
      },
      {
        signal: this.events.signal,
      },
    );

    this.popover.addEventListener('toggle', () => this.handleToggle(), {
      signal: this.events.signal,
    });
  }

  destroy(): void {
    this.openEvents?.abort();
    this.events.abort();
    if (this.popover.matches(':popover-open')) this.popover.hidePopover();
  }

  private updatePopoverSurface(): void {
    // Match the nearest painted page surface, including custom Bandcamp themes.
    let ancestor: HTMLElement | null = this.element.parentElement;
    while (ancestor) {
      const background = getComputedStyle(ancestor).backgroundColor;
      if (
        background !== 'transparent' &&
        !/(?:^rgba\([^)]*,|\/)\s*0(?:\.0*)?\s*\)$/.test(background)
      ) {
        this.popover.style.setProperty('--bcx-keywords-surface', background);
        return;
      }
      ancestor = ancestor.parentElement;
    }
    this.popover.style.setProperty('--bcx-keywords-surface', 'Canvas');
  }

  private handleToggle(): void {
    this.openEvents?.abort();
    this.openEvents = null;
    if (!this.popover.matches(':popover-open')) return;

    this.positionPopover();
    this.openEvents = new AbortController();
    const options = { signal: this.openEvents.signal };
    window.addEventListener('resize', this.positionPopover, options);
    document.addEventListener('scroll', this.positionPopover, {
      ...options,
      capture: true,
    });
  }

  private readonly positionPopover = (): void => {
    this.setPopoverPosition(
      this.popover.offsetWidth,
      this.popover.offsetHeight,
    );
  };

  private setPopoverPosition(width: number, height: number): void {
    const trigger = this.trigger.getBoundingClientRect();
    const margin = 8;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const left = Math.max(
      margin,
      Math.min(trigger.left, viewportWidth - width - margin),
    );
    const below = trigger.bottom + margin;
    const above = trigger.top - height - margin;
    const preferredTop =
      below + height <= viewportHeight - margin ? below : above;
    const top = Math.max(
      margin,
      Math.min(preferredTop, viewportHeight - height - margin),
    );
    this.popover.style.left = `${left}px`;
    this.popover.style.top = `${top}px`;
  }
}
