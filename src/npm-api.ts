export type NpmPackageLatestVersionResponse = {
  name: string;
  version: string;
  description?: string;
  keywords: string[];
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  };
  author?: {
    name: string;
    email?: string;
    url?: string;
  };
  license?: string;
  // TODO: Add more fields as needed
};

export async function fetchNpmPackageLatestVersion(packageName: string) {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch data for package "${packageName}. Status: ${response.status}`);
  }
  return response.json();
}

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
