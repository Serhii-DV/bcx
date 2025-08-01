import { mount } from 'svelte';
import App from './App.svelte';
import 'src/utils/console';

console.log('Hello from Bandcamp content module!');

function mountApp() {
  if (!window.location.hostname.includes('bandcamp.com')) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'bcx-app';
  document.body.appendChild(container);

  mount(App, {
    target: container,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
