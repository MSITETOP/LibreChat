import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import './mobile.css';
import { ApiErrorBoundaryProvider } from './hooks/ApiErrorBoundaryContext';

const container = document.getElementById('root');
const root = createRoot(container);

const CustomStyles = () => {
  useEffect(() => {
    const cssUrl = process.env.CUSTOM_CSS;

    if (cssUrl) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssUrl;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, []);

  return null;
};

root.render(
  <ApiErrorBoundaryProvider>
    <CustomStyles />
    <App />
  </ApiErrorBoundaryProvider>,
);
