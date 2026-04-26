import { mount } from 'svelte';
import 'src/utils/console';
import App from './app.svelte';
import './style.css';

const app = mount(App, {
  target: document.getElementById('root') as HTMLElement,
});

export default app;
