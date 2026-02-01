import { HomePage, bindHomeHandlers } from './pages/home.js';

const routes = {
  '#/': {
    title: 'Goblin',
    render: (state) => HomePage(state),
    bind: bindHomeHandlers,
  },
};

export function resolveRoute(hash) {
  return routes[hash] ?? routes['#/'];
}
