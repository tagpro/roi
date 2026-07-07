import type { PortfolioMetrics } from './metrics';
import { formatCurrency, formatPrice, formatSignedPercent } from '../format';

/** |ROI| below this reads as "roughly flat". */
const FLAT_THRESHOLD = 0.005;

const CAVEAT =
  'Current value is estimated from the most recent transaction’s unit price in the file — not a live valuation.';

/**
 * Turn metrics into 3–5 plain-English sentences explaining the result.
 * Pure and deterministic.
 */
export function generateNarrative(m: PortfolioMetrics): string[] {
  const sentences: string[] = [];

  // 1. Headline — tone follows the sign of ROI.
  const invested = formatCurrency(m.totalInvested);
  const value = formatCurrency(m.estimatedValue);
  const gainAbs = formatCurrency(Math.abs(m.netGain));
  const roiText = m.simpleROI !== null ? formatSignedPercent(m.simpleROI) : null;
  const deposits = `${m.depositCount} deposit${m.depositCount === 1 ? '' : 's'}`;

  const roi = m.simpleROI ?? 0;
  if (Math.abs(roi) < FLAT_THRESHOLD) {
    sentences.push(
      `You invested ${invested} across ${deposits} and it’s now worth about ${value} — roughly flat, a ${
        m.netGain >= 0 ? 'gain' : 'loss'
      } of ${gainAbs}${roiText ? ` (${roiText})` : ''}.`,
    );
  } else if (roi > 0) {
    sentences.push(
      `You invested ${invested} across ${deposits} and it’s now worth about ${value} — a gain of ${gainAbs}${
        roiText ? ` (${roiText})` : ''
      }.`,
    );
  } else {
    sentences.push(
      `You invested ${invested} across ${deposits} and it’s now worth about ${value} — a loss of ${gainAbs}${
        roiText ? ` (${roiText})` : ''
      }.`,
    );
  }

  // 2. External flows that make the headline less obvious: money taken out is
  // still part of the outcome, and reinvested distributions are earnings.
  if (m.totalWithdrawn > 0) {
    sentences.push(
      `Along the way you withdrew ${formatCurrency(
        m.totalWithdrawn,
      )}, which counts toward your total return.`,
    );
  }
  if (m.totalDistributions > 0) {
    sentences.push(
      `That includes ${formatCurrency(
        m.totalDistributions,
      )} of distributions reinvested as extra units — earnings, not money out of your pocket.`,
    );
  }

  // 3. Annualised (money-weighted) — only when computable.
  if (m.xirr !== null) {
    sentences.push(
      `That’s about ${formatSignedPercent(
        m.xirr,
      )} per year, money-weighted (XIRR), accounting for when each dollar was invested.`,
    );
  }

  // 4. Price move vs dollar-cost-averaging — the four sign combinations.
  if (m.unitPriceChange !== null && m.simpleROI !== null) {
    const priceMove = m.unitPriceChange;
    const priceMag = formatSignedPercent(priceMove).replace(/^[+-]/, '');
    const roiNonNeg = m.simpleROI >= 0;

    if (priceMove < 0 && roiNonNeg) {
      sentences.push(
        `The unit price actually fell ${priceMag} over the period, but dollar-cost averaging — buying more units when prices were lower — kept your overall return positive.`,
      );
    } else if (priceMove < 0 && !roiNonNeg) {
      sentences.push(
        `The unit price fell ${priceMag} over the period and your overall return is negative too, though dollar-cost averaging softened the drop.`,
      );
    } else if (priceMove >= 0 && roiNonNeg) {
      sentences.push(
        `The unit price rose ${priceMag} over the period, and buying steadily through it left your overall return positive.`,
      );
    } else {
      sentences.push(
        `Even though the unit price rose ${priceMag} over the period, your overall return is negative — much of your money went in when prices were higher than they are today.`,
      );
    }
  }

  // 5. Cost basis.
  if (m.avgCostPerUnit !== null && m.latestUnitPrice !== null) {
    sentences.push(
      `Your average cost per unit is ${formatPrice(
        m.avgCostPerUnit,
      )} versus the latest price of ${formatPrice(m.latestUnitPrice)}.`,
    );
  }

  // 6. Always-on caveat.
  sentences.push(CAVEAT);

  return sentences;
}

export { CAVEAT };
