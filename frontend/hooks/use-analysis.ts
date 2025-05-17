import { useState } from 'react';
import { analyzeImages } from '../lib/api';
import type { AnalysisResult } from '../types/analysis';

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis(preImage: File, postImage: File) {
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeImages(preImage, postImage);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  return { loading, result, error, runAnalysis };
}
