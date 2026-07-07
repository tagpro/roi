import { useState } from 'react';
import { providers } from '../providers';
import { ProviderTab } from './ProviderTab';

export function App() {
  const [activeId, setActiveId] = useState(providers[0]?.id ?? '');
  const active = providers.find((p) => p.id === activeId) ?? providers[0];

  return (
    <div className="app">
      <header className="app-header">
        <h1>ROI Analyzer</h1>
        <p className="app-tagline">
          Drop an investment transaction export and see how it actually performed — everything
          stays in your browser.
        </p>
      </header>

      <nav className="tab-bar" role="tablist" aria-label="Providers">
        {providers.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={p.id === active?.id}
            className={`tab ${p.id === active?.id ? 'tab-active' : ''}`}
            onClick={() => setActiveId(p.id)}
          >
            {p.label}
          </button>
        ))}
      </nav>

      <main>{active && <ProviderTab key={active.id} provider={active} />}</main>

      <footer className="app-footer">
        Numbers are estimates derived from the file you provide. Not financial advice.
      </footer>
    </div>
  );
}

export default App;
