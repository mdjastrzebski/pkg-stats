export function formatDownloads(downloads: number) {
  let formatted: string;
  if (downloads >= 1000000) {
    formatted = `${(downloads / 1000000).toFixed(1)}M`;
  } else if (downloads >= 1000) {
    formatted = `${(downloads / 1000).toFixed(1)}K`;
  } else {
    formatted = downloads.toString();
  }

  return formatted.padStart(6); // Fixed width for alignment
}
