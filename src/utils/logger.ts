import chalk from 'chalk';

let debug = false;

export function setDebug(value: boolean) {
  debug = value;
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (debug) {
      console.log(chalk.gray(...args));
    }
  },
  warn: (...args: unknown[]) => {
    console.warn(chalk.yellow(...args));
  },
};
