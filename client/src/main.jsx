import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import './mobile.css';
import { ApiErrorBoundaryProvider } from './hooks/ApiErrorBoundaryContext';
import { useEffect } from 'react';

export default function LoadCSS({ href }) {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, [href]);

  return null; // Компонент ничего не рендерит, просто загружает CSS
}
const customCSS = process.env.CUSTOM_CSS;
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ApiErrorBoundaryProvider>
    <LoadCSS href={customCSS} />
    <App />
  </ApiErrorBoundaryProvider>,
);
