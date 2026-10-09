// Temporary workaround for the widget injected by another extension.
export function removeB2dWidget(): void {
  const selector = '.b2d-widget-container';

  const removeContainers = (root: Document | Element) => {
    if (root instanceof Element && root.matches(selector)) {
      root.remove();
      return;
    }

    for (const container of Array.from(root.querySelectorAll(selector))) {
      container.remove();
    }
  };

  removeContainers(document);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        if (
          mutation.target instanceof Element &&
          mutation.target.matches(selector)
        ) {
          mutation.target.remove();
        }
        continue;
      }

      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof Element) {
          removeContainers(node);
        }
      }
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });

  const onPageHide = (event: PageTransitionEvent) => {
    if (!event.persisted) {
      observer.disconnect();
      window.removeEventListener('pagehide', onPageHide);
    }
  };
  window.addEventListener('pagehide', onPageHide);
}
