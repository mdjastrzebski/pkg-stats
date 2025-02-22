import chalk from 'chalk';
import meow from 'meow';
import redent from 'redent';

import { COLOR_SCHEMES, type ColorScheme, getColorOfDay } from './colors.js';

const colorCommand = chalk.hex('#22c1c3');
const colorOption = chalk.hex('#fdbb2d');

const HELP = `
  ${colorCommand('pkg-stats')} <package> - Show version stats
  ${colorCommand('pkg-stats')} <package-1> <package-2>... - Compare between packages

Options:
  ${colorOption('--major')}               Group by major version
  ${colorOption('--minor')}               Group by minor version
  ${colorOption('--patch')}               Group by patch version
  ${colorOption('-t, --top')} <number>    Show top <number> most downloaded versions
  ${colorOption(
    '-a, --all',
  )}             Include all versions in output, even those with minimal downloads
  ${colorOption('-c, --color')} <scheme>  ${wrapOption(
  `Choose color scheme from: ${COLOR_SCHEMES.sort().join(', ')}`,
  50,
  24,
)}

Examples:
  ${chalk.dim('# Show stats for react')}
  ${colorCommand('pkg-stats')} react

  ${chalk.dim('# Compare react, vue, angular and svelte')}
  ${colorCommand('pkg-stats')} react vue @angular/core svelte

  ${chalk.dim('# Show top 10 major versions of lodash')}
  ${colorCommand('pkg-stats')} lodash ${colorOption('--major -t 10')}
`;

function wrapOption(text: string, maxLength: number, indent: number) {
  const words = text.split(' ');

  let result = '';
  let currentLine = words[0];
  for (let i = 1; i < words.length; i++) {
    const nextCurrentLine = currentLine + ' ' + words[i];
    if (nextCurrentLine.length <= maxLength) {
      currentLine = nextCurrentLine;
    } else {
      result += `\n${currentLine}`;
      currentLine = words[i];
    }
  }

  if (currentLine) {
    result += `\n${currentLine}`;
  }

  return redent(result.trim(), indent).trim();
}

export function showHelp() {
  console.log(redent(HELP, 2));
}

export type CliOptions = {
  packageNames: string[];
  group?: 'major' | 'minor' | 'patch';
  top?: number;
  all: boolean;
  color: ColorScheme;
};

export function parseCliOptions(argv: string[]): CliOptions {
  const cli = meow(HELP, {
    argv: argv.slice(2),
    autoHelp: true,
    description: 'Show NPM weekly downloads stats:',
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
    all: cli.flags.all ?? false,
    color: coalesceColor(cli.flags.color ?? process.env.PKG_STATS_COLOR_SCHEME) ?? getColorOfDay(),
  };
}

function coalesceColor(color: string | undefined): ColorScheme | undefined {
  if (color && COLOR_SCHEMES.includes(color as ColorScheme)) {
    return color as ColorScheme;
  }

  return undefined;
}
