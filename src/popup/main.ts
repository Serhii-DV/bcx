import { mount } from 'svelte';
import App from './App.svelte';
import './style.css';
import 'src/utils/console';

const app = mount(App, {
  target: document.getElementById('root') as HTMLElement,
});

export default app;
