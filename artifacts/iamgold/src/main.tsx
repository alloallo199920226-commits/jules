import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';
import './styles/premium/foundation.css';
import './styles/premium/shell.css';
import './styles/premium/content.css';
import './styles/premium/member-pages.css';
import './styles/premium/responsive.css';
import './styles/iamgold-system.css';
import './iamgold-industrial-system/iamgold-industrial.css';
import './pages/member/investment-experience.css';
import './pages/member/investment-dialog.css';
import './iamgold-industrial-system/industrial-editorial.css';
import './pages/member/industrial-finance.css';
import './pages/member/royal-pages.css';
import './pages/member/supreme-settings.css';
import './pages/member/security-publish.css';
import './pages/member/reference-fidelity.css';
import './pages/member/reference-fidelity-secondary.css';
import './pages/member/reference-fidelity-lottery-help.css';
import './pages/member/missions-reference.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ErrorBoundary>,
);
