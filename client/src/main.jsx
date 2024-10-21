import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import './mobile.css';
import 'https://d5d2sf46dn7jn3s1a6ei.apigw.yandexcloud.net/static/gpt.css';
import 'https://d5d2sf46dn7jn3s1a6ei.apigw.yandexcloud.net/static/gpt.js';
import { ApiErrorBoundaryProvider } from './hooks/ApiErrorBoundaryContext';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ApiErrorBoundaryProvider>
    <App />
  </ApiErrorBoundaryProvider>,
);
