export function partitionSettledWithContext<T, C>(
  contexts: C[],
  results: PromiseSettledResult<T>[]
): {
  fulfilled: { context: C; value: T }[];
  rejected: { context: C; error: unknown }[];
} {
  const fulfilled: { context: C; value: T }[] = [];
  const rejected: { context: C; error: unknown }[] = [];

  results.forEach((result, index) => {
    const context = contexts[index];

    if (result.status === 'fulfilled') {
      fulfilled.push({
        context,
        value: result.value,
      });
    } else {
      rejected.push({
        context,
        error: result.reason,
      });
    }
  });

  return { fulfilled, rejected };
}
