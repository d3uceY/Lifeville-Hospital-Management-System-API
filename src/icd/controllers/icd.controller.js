import { searchICD, lookupByCode } from '../services/icd.services';

/**
 * GET /api/icd?q=<query>
 *
 * - If query looks like a code prefix (e.g. "A00", "E11.9") → prefix-match on codes
 * - Otherwise → keyword search against descriptions
 * - Always returns at most 20 results
 */
export const searchIcdCodes = (req, res, next) => {
  try {
    const q = req.query.q;

    if (typeof q !== 'string' || q.trim() === '') {
      res.status(400).json({
        status: 'error',
        message: 'Query parameter "q" is required and must be a non-empty string.',
      });
      return;
    }

    const results = searchICD(q);

    res.status(200).json({
      query: q.trim(),
      count: results.length,
      results,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/icd/:code
 *
 * Exact code lookup — returns a single entry or 404.
 */
export const getIcdByCode = (req, res, next) => {
  try {
    const raw = req.params.code;
    const code = Array.isArray(raw) ? raw[0] : raw;

    const entry = lookupByCode(code);

    if (!entry) {
      res.status(404).json({
        status: 'error',
        message: `ICD-10-CM code "${code.toUpperCase()}" not found.`,
      });
      return;
    }

    res.status(200).json(entry);
  } catch (err) {
    next(err);
  }
};
