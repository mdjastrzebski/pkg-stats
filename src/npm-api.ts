export type NpmPackageLatestVersionResponse = {
  name: string;
  version: string;
  description?: string;
  keywords: string[];
  homepage?: string;
  repositoryUrl?: string;
  author?: string;
  license?: string;
  // TODO: Add more fields as needed
};

export async function fetchNpmPackageLatestVersion(
  packageName: string,
): Promise<NpmPackageLatestVersionResponse> {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch data for package "${packageName}. Status: ${response.status}`);
  }
  const data = await response.json();

  return {
    name: data.name,
    version: data.version,
    description: data.description,
    keywords: data.keywords,
    homepage: data.homepage,
    repositoryUrl: parseRepositoryUrl(data.repository?.url),
    author: parseAuthor(data.author),
    license: data.license,
  };
}

function parseRepositoryUrl(repositoryUrl: string | undefined) {
  if (!repositoryUrl) {
    return undefined;
  }

  if (repositoryUrl.startsWith('git+')) {
    return repositoryUrl.slice(4);
  }

  return repositoryUrl;
}

function parseAuthor(author: { name: string; email?: string; url?: string }) {
  if (!author) {
    return undefined;
  }

  let result = author.name;
  if (author.url) {
    result += ` (${author.url})`;
  }

  return result;
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
