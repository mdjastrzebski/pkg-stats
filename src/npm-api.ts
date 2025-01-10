export type NpmLastWeekDownloadsResponse = {
  package: string;
  downloads: Record<string, number>;
};

export async function fetchNpmLastWeekDownloads(
  packageName: string,
): Promise<NpmLastWeekDownloadsResponse> {
  const response = await fetch(
    `https://api.npmjs.org/versions/${encodeURIComponent(packageName)}/last-week`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch data for package "${packageName}. Status: ${response.status}`);
  }

  const json = await response.json();
  if (!json.downloads) {
    throw new Error('No downloads found');
  }

  return {
    package: packageName,
    downloads: json.downloads,
  };
}
