import { mount } from 'svelte';
import App from './app.svelte';
import './style.css';
import 'src/utils/console';
import { markAppSetupStart, measureAppMount } from 'src/utils/performance';

const setupStartMark = markAppSetupStart('popup');

const app = measureAppMount(
  {
    label: 'popup',
    setupStartMark,
  },
  () =>
    mount(App, {
      target: document.getElementById('root') as HTMLElement,
    }),
);

export default app;
