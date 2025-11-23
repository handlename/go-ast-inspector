import { mount } from 'svelte';
import App from './App.svelte';
import './styles/global.css';

const app = mount(App, {
  // biome-ignore lint/style/noNonNullAssertion: app element is guaranteed to exist in index.html
  target: document.getElementById('app')!,
});

export default app;
