// Normalized domain model shared across providers and business logic.

export type Direction = 'in' | 'out';

export interface Transaction {
  transactionDate: string; // ISO yyyy-mm-dd
  effectiveDate: string; // ISO yyyy-mm-dd — use this for time-based math
  type: string; // e.g. "Investment plan (weekly)"
  status: string; // e.g. "Paid"
  amount: number; // AUD, positive as given in file
  units: number; // units in the transaction
  unitPrice: number; // price per unit at the transaction
  direction: Direction; // derived from Unit Change Type
  portfolio: string; // e.g. "Spaceship Universe Portfolio"
}

/** A row-level problem that did not stop parsing but should be surfaced. */
export interface RowWarning {
  rowNumber: number; // 1-based data row index (excludes header)
  message: string;
  raw?: string;
}

export interface ParseResult {
  transactions: Transaction[];
  warnings: RowWarning[];
}

/** Raised when a file clearly does not belong to a provider (bad header, empty). */
export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export interface ProviderAdapter {
  id: string; // 'spaceship'
  label: string; // 'Spaceship'
  sampleHint: string; // shown in the empty state, e.g. expected header row
  /** Parse raw CSV text into normalized transactions. Throws ParseError on wrong file. */
  parse(csvText: string): ParseResult;
}
