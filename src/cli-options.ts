import meow from 'meow';
import redent from 'redent';

import { COLOR_SCHEMES, type ColorScheme } from './colors.js';

const HELP = `
pkg-stats <package-name>

Show NPM weekly downloads stats for a package

Options:
  -h, --help            Show help
  --major               Group by major version
  --minor               Group by minor version
  --patch               Group by patch version
  -t, --top <number>    Show top <number> versions
  -a, --all             Show ALL versions (even negligible ones)
  -c, --color <color>   Color scheme: ${COLOR_SCHEMES.sort().join(', ')}
`;

export function showHelp() {
  console.log(redent(HELP, 2));
}

export type CliOptions = {
  packageNames: string[];
  group?: 'major' | 'minor' | 'patch';
  top?: number;
  all?: boolean;
  color?: ColorScheme;
};

export function parseCliOptions(argv: string[]): CliOptions {
  const cli = meow(HELP, {
    argv: argv.slice(2),
    autoHelp: true,
    description: 'Show NPM weekly downloads stats for a package',
    importMeta: import.meta,
    flags: {
      help: {
        type: 'boolean',
        shortFlag: 'h',
      },
      major: {
        type: 'boolean',
        shortFlag: 'm',
      },
      minor: {
        type: 'boolean',
      },
      patch: {
        type: 'boolean',
      },
      top: {
        shortFlag: 't',
        type: 'number',
      },
      all: {
        type: 'boolean',
        shortFlag: 'a',
      },
      color: {
        shortFlag: 'c',
        type: 'string',
        choices: COLOR_SCHEMES,
      },
    },
  });

  if (cli.flags.help) {
    cli.showHelp();
  }

  if (!cli.input.length) {
    throw new Error('At least one <package-name> is required');
  }

  return {
    packageNames: cli.input,
    group: cli.flags.major
      ? 'major'
      : cli.flags.minor
      ? 'minor'
      : cli.flags.patch
      ? 'patch'
      : undefined,
    top: cli.flags.top,
    all: cli.flags.all,
    color: cli.flags.color as ColorScheme,
  };
}
