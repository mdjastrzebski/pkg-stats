import chalk from 'chalk';

import { type CliOptions } from '../../cli-options.js';
import { printChart } from '../../utils/chart.js';
import { getPrimaryColor } from '../../utils/colors.js';
import { formatPercentage } from '../../utils/format.js';
import { getVersionsLastWeek } from '../data/repository.js';
import { parseVersion } from '../data/version.js';
import { filterGroups, groupDownloads } from '../data/version-group.js';
import { type NpmVersionsLastWeekResponse } from '../network/npm-api.js';

type DisplayStats = {
  versionString: string;
  downloads: number;
};

const MIN_DOWNLOADS_SHARE = 0.005; // 0.5%

export async function printPackageStats(packageName: string, options: CliOptions) {
  let data: NpmVersionsLastWeekResponse;
  try {
    data = await getVersionsLastWeek(packageName);
  } catch (error) {
    console.error(`Failed to fetch data for package "${packageName}"`, error);
    return;
  }

  if (!Object.keys(data.downloads).length) {
    console.error(`No data found for package "${packageName}".\n`);
    process.exit(1);
  }

  const versions = Object.keys(data.downloads).map((versionString) => {
    return {
      version: parseVersion(versionString),
      downloads: data.downloads[versionString],
    };
  });

  const { type, groups } = groupDownloads(versions, options.group);
  const totalDownloads = sum(groups, (group) => group.downloads);

  const groupsToDisplay: DisplayStats[] = filterGroups(groups, {
    min: MIN_DOWNLOADS_SHARE * totalDownloads,
    all: options.all,
    top: options.top,
  });

  const totalDisplayed = sum(groupsToDisplay, (group) => group.downloads);
  if (totalDownloads - totalDisplayed > 0) {
    groupsToDisplay.push({
      versionString: 'rest',
      downloads: totalDownloads - totalDisplayed,
    });
  }

  const primaryColor = chalk.hex(getPrimaryColor(options.color));
  console.log(chalk.bold(`\nNPM weekly downloads for ${primaryColor(packageName)}\n`));
  console.log(`Total: ${primaryColor(totalDownloads.toLocaleString())} last week\n`);

  console.log(options.top ? `Top ${options.top} ${type} versions:\n` : `By ${type} version:\n`);

  const items = groupsToDisplay.map((item) => ({
    label: item.versionString,
    value: item.downloads,
    extended: formatPercentage(item.downloads / totalDownloads),
  }));

  printChart(items, {
    colorScheme: options.color,
    indent: 2,
  });
}

function sum<T>(elements: T[], selector: (element: T) => number) {
  return elements.reduce((sum, element) => sum + selector(element), 0);
}
