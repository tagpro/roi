import { useCallback, useMemo, useRef, useState } from 'react';
import type { ProviderAdapter, ParseResult, Transaction } from '../types';
import { ParseError } from '../types';
import { buildSeries, computeAll } from '../logic/metrics';
import { generateNarrative } from '../logic/narrative';
import { SummaryTiles } from './SummaryTiles';
import { Charts } from './Charts';
import { TransactionsTable } from './TransactionsTable';

interface LoadedFile {
  fileName: string;
  result: ParseResult;
}

export function ProviderTab({ provider }: { provider: ProviderAdapter }) {
  const [loaded, setLoaded] = useState<LoadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleText = useCallback(
    (text: string, fileName: string) => {
      try {
        const result = provider.parse(text);
        if (result.transactions.length === 0) {
          setError(
            'No transactions could be read from this file. Check that it is the right export.',
          );
          setLoaded(null);
          return;
        }
        setError(null);
        setLoaded({ fileName, result });
      } catch (e) {
        setLoaded(null);
        setError(
          e instanceof ParseError
            ? e.message
            : 'Something went wrong reading that file. Is it a valid CSV?',
        );
      }
    },
    [provider],
  );

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => handleText(String(reader.result ?? ''), file.name);
      reader.onerror = () => setError('Could not read that file.');
      reader.readAsText(file);
    },
    [handleText],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  if (!loaded) {
    return (
      <section className="panel">
        <div
          className={`dropzone ${dragging ? 'dropzone-active' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
        >
          <div className="dropzone-icon" aria-hidden>
            ⬆
          </div>
          <p className="dropzone-title">
            Drop your {provider.label} CSV here, or click to choose a file
          </p>
          <p className="dropzone-hint">
            In {provider.label}, export your transaction history as CSV. Expected columns:
          </p>
          <code className="dropzone-columns">{provider.sampleHint}</code>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="visually-hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
      </section>
    );
  }

  return (
    <Results
      provider={provider}
      fileName={loaded.fileName}
      result={loaded.result}
      onReset={() => {
        setLoaded(null);
        setError(null);
      }}
    />
  );
}

function Results({
  provider,
  fileName,
  result,
  onReset,
}: {
  provider: ProviderAdapter;
  fileName: string;
  result: ParseResult;
  onReset: () => void;
}) {
  const { perPortfolio, overall } = useMemo(
    () => computeAll(result.transactions),
    [result.transactions],
  );
  const multiPortfolio = perPortfolio.length > 1;

  return (
    <div className="results">
      <div className="results-toolbar">
        <div>
          <span className="results-filename">{fileName}</span>
          <span className="results-count">
            {result.transactions.length} transactions · {perPortfolio.length} portfolio
            {perPortfolio.length === 1 ? '' : 's'}
          </span>
        </div>
        <button className="btn-secondary" onClick={onReset}>
          Load another file
        </button>
      </div>

      {result.warnings.length > 0 && (
        <div className="alert alert-warn" role="status">
          {result.warnings.length} row{result.warnings.length === 1 ? '' : 's'} were skipped or
          flagged. See the table below for details.
        </div>
      )}

      {multiPortfolio && (
        <PortfolioSection
          title="Combined summary"
          metrics={overall}
          transactions={result.transactions}
        />
      )}

      {perPortfolio.map((m) => (
        <PortfolioSection
          key={m.portfolio}
          title={m.portfolio}
          metrics={m}
          transactions={result.transactions.filter((t) => t.portfolio === m.portfolio)}
        />
      ))}

      <p className="provider-note">Parsed with the {provider.label} adapter.</p>
    </div>
  );
}

function PortfolioSection({
  title,
  metrics,
  transactions,
}: {
  title: string;
  metrics: ReturnType<typeof computeAll>['overall'];
  transactions: Transaction[];
}) {
  const series = useMemo(() => buildSeries(transactions), [transactions]);
  const narrative = useMemo(() => generateNarrative(metrics), [metrics]);

  return (
    <section className="portfolio-section">
      <h2 className="portfolio-title">{title}</h2>
      <SummaryTiles m={metrics} />
      <div className="narrative" aria-label="Plain-English explanation">
        {narrative.map((s, i) => (
          <p key={i} className={i === narrative.length - 1 ? 'narrative-caveat' : ''}>
            {s}
          </p>
        ))}
      </div>
      <Charts series={series} />
      <TransactionsTable transactions={transactions} />
    </section>
  );
}
