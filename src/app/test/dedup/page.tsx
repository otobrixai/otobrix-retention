// src/app/test/dedup/page.tsx
import { DeduplicationTest } from '@/components/test/DeduplicationTest';

export default function DedupTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Request Deduplication Test</h1>
      <p className="mb-4 text-gray-600">
        This page tests React Query&apos;s request deduplication feature.
        Multiple simultaneous requests for the same data should result in only one network call.
      </p>
      <DeduplicationTest />
    </div>
  );
}