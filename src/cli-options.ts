import { program } from 'commander';

import { COLOR_SCHEMES, type ColorScheme } from './colors.js';

export type CliOptions = {
  packageName: string;
  group?: 'major' | 'minor' | 'patch';
  top?: number;
  color?: ColorScheme;
};

type CommanderOptions = {
  major?: boolean;
  minor?: boolean;
  patch?: boolean;
  top?: string;
  color?: string;
};

export function parseCliOptions(argv: string[]): CliOptions {
  program
    .name('pkg-stats')
    .description('Show NPM weekly downloads stats for a package')
    .argument('<package-name>', 'Package name')
    .option('--major', 'Group by major version')
    .option('--minor', 'Group by minor version')
    .option('--patch', 'Group by patch version')
    .option('-t, --top <number>', 'Show top <number> versions')
    .option('-c, --color <color>', 'Color scheme: ' + COLOR_SCHEMES.join(', '))
    .parse(argv);

  const args = program.args;
  const options = program.opts<CommanderOptions>();

  return {
    packageName: args[0],
    group: options.major ? 'major' : options.minor ? 'minor' : options.patch ? 'patch' : undefined,
    top: options.top !== undefined ? parseInt(options.top) : undefined,
    color:
      options.color && COLOR_SCHEMES.includes(options.color as ColorScheme)
        ? (options.color as ColorScheme)
        : undefined,
  };
}
