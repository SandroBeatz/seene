/** Takes a row out of the cached lists at once and can put it back, before anything is deleted. */
import type { QueryClient, QueryKey } from '@tanstack/react-query';

export function hideFromLists(
  qc: QueryClient,
  keys: readonly QueryKey[],
  match: string | ((row: unknown) => boolean),
) {
  const hides = typeof match === 'string' ? (row: { id?: unknown }) => row?.id === match : match;
  const before = keys.flatMap((queryKey) => qc.getQueriesData<unknown>({ queryKey }));
  for (const queryKey of keys) {
    void qc.cancelQueries({ queryKey });
    qc.setQueriesData<unknown>({ queryKey }, (data: unknown) =>
      Array.isArray(data) ? data.filter((row) => !hides(row)) : data,
    );
  }
  return () => {
    for (const [queryKey, data] of before) qc.setQueryData(queryKey, data);
    for (const queryKey of keys) void qc.invalidateQueries({ queryKey });
  };
}
