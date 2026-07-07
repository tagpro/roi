import { useMemo, useState } from 'react';
import type { Transaction } from '../types';
import { formatCurrency, formatPrice, formatUnits } from '../format';

type SortDir = 'asc' | 'desc';

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const [dir, setDir] = useState<SortDir>('desc');

  const rows = useMemo(() => {
    const sorted = [...transactions].sort((a, b) =>
      a.effectiveDate < b.effectiveDate ? -1 : a.effectiveDate > b.effectiveDate ? 1 : 0,
    );
    return dir === 'asc' ? sorted : sorted.reverse();
  }, [transactions, dir]);

  return (
    <details className="txn-details">
      <summary className="txn-summary">Transactions ({transactions.length})</summary>
      <div className="txn-scroll">
        <table className="txn-table">
          <thead>
            <tr>
              <th>
                <button
                  className="th-sort"
                  onClick={() => setDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                >
                  Effective date {dir === 'asc' ? '▲' : '▼'}
                </button>
              </th>
              <th>Type</th>
              <th>Status</th>
              <th className="num">Amount</th>
              <th className="num">Units</th>
              <th className="num">Unit price</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => {
              const excluded = t.status.toLowerCase() !== 'paid';
              return (
                <tr key={`${t.effectiveDate}-${i}`} className={excluded ? 'row-excluded' : ''}>
                  <td>{t.effectiveDate}</td>
                  <td>{t.type}</td>
                  <td>{t.status}</td>
                  <td className="num">
                    {t.direction === 'out' ? '−' : ''}
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="num">{formatUnits(t.units)}</td>
                  <td className="num">{formatPrice(t.unitPrice)}</td>
                  <td>
                    {excluded && <span className="badge badge-excluded">excluded</span>}
                    {t.direction === 'out' && <span className="badge badge-out">withdrawal</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}
