import Papa from 'papaparse';
import {
  ParseError,
  type ParseResult,
  type ProviderAdapter,
  type RowWarning,
  type Transaction,
  type Direction,
} from '../types';

// Exact header the Spaceship export produces.
const REQUIRED_COLUMNS = [
  'Transaction Date',
  'Transaction Type',
  'Status',
  'Amount',
  'Units',
  'Unit Price',
  'Unit Change Type',
  'Effective Date',
  'Portfolio',
] as const;

/**
 * Derive flow direction from the "Unit Change Type" column.
 * "Units issued" -> money/units in. Anything containing redeem/cancel -> out.
 * Returns null when the value is unrecognised (row is skipped with a warning).
 */
export function directionFromUnitChangeType(value: string): Direction | null {
  const v = value.trim().toLowerCase();
  if (v === 'units issued' || v === 'units allotted') return 'in';
  if (v.includes('redeem') || v.includes('cancel')) return 'out';
  return null;
}

function parseNumber(raw: string): number {
  // Strip currency symbols, thousands separators and whitespace.
  const cleaned = raw.replace(/[$,\s]/g, '');
  return Number(cleaned);
}

const spaceship: ProviderAdapter = {
  id: 'spaceship',
  label: 'Spaceship',
  sampleHint:
    'Transaction Date, Transaction Type, Status, Amount, Units, Unit Price, Unit Change Type, Effective Date, Portfolio',

  parse(csvText: string): ParseResult {
    const trimmed = csvText.trim();
    if (trimmed.length === 0) {
      throw new ParseError('The file is empty. Export your transactions from Spaceship and try again.');
    }

    const parsed = Papa.parse<Record<string, string>>(trimmed, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
    });

    const fields = parsed.meta.fields ?? [];
    const missing = REQUIRED_COLUMNS.filter((c) => !fields.includes(c));
    if (missing.length > 0) {
      throw new ParseError(
        `This doesn't look like a Spaceship export. Missing column${
          missing.length > 1 ? 's' : ''
        }: ${missing.join(', ')}.`,
      );
    }

    const transactions: Transaction[] = [];
    const warnings: RowWarning[] = [];

    parsed.data.forEach((row, idx) => {
      const rowNumber = idx + 1;

      // A row PapaParse still handed back but with no substantive content.
      const isBlank = REQUIRED_COLUMNS.every((c) => (row[c] ?? '').trim() === '');
      if (isBlank) return;

      const unitChangeType = row['Unit Change Type'] ?? '';
      const direction = directionFromUnitChangeType(unitChangeType);
      if (direction === null) {
        warnings.push({
          rowNumber,
          message: `Skipped row with unrecognised Unit Change Type "${unitChangeType}".`,
        });
        return;
      }

      const amount = parseNumber(row['Amount'] ?? '');
      const units = parseNumber(row['Units'] ?? '');
      const unitPrice = parseNumber(row['Unit Price'] ?? '');
      const transactionDate = (row['Transaction Date'] ?? '').trim();
      const effectiveDate = (row['Effective Date'] ?? '').trim();

      if (
        !Number.isFinite(amount) ||
        !Number.isFinite(units) ||
        !Number.isFinite(unitPrice) ||
        effectiveDate === ''
      ) {
        warnings.push({
          rowNumber,
          message: `Skipped row with unparseable amount, units, price or effective date.`,
        });
        return;
      }

      transactions.push({
        transactionDate,
        effectiveDate,
        type: (row['Transaction Type'] ?? '').trim(),
        status: (row['Status'] ?? '').trim(),
        amount,
        units,
        unitPrice,
        direction,
        portfolio: (row['Portfolio'] ?? '').trim() || 'Unknown portfolio',
      });
    });

    return { transactions, warnings };
  },
};

export default spaceship;
