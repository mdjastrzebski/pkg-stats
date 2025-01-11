import tinygradient from 'tinygradient';

export type ColorScheme = keyof typeof gradients;

type GradientConfig = {
  colors: readonly string[];
  options: {
    interpolation?: 'hsv' | 'rgb';
    hsvSpin?: 'short' | 'long';
    padEnd?: number;
    reverse?: boolean;
  };
};

// See: https://github.com/bokub/gradient-string/blob/465e86c8499a7f427c45afb1861f1444a2db74b9/src/index.ts#L166
const gradients = {
  atlas: { colors: ['#feac5e', '#c779d0', '#4bc0c8'], options: {} },
  cristal: { colors: ['#bdfff3', '#4ac29a'], options: {} },
  teen: { colors: ['#77a1d3', '#79cbca', '#e684ae'], options: {} },
  mind: { colors: ['#473b7b', '#3584a7', '#30d2be'], options: {} },
  morning: { colors: ['#ff5f6d', '#ffc371'], options: { interpolation: 'hsv' } },
  vice: { colors: ['#5ee7df', '#b490ca'], options: { interpolation: 'hsv' } },
  passion: { colors: ['#f43b47', '#453a94'], options: {} },
  fruit: { colors: ['#ff4e50', '#f9d423'], options: {} },
  insta: { colors: ['#833ab4', '#fd1d1d', '#fcb045'], options: {} },
  retro: {
    colors: [
      '#3f51b1',
      '#5a55ae',
      '#7b5fac',
      '#8f6aae',
      '#a86aa4',
      '#cc6b8e',
      '#f18271',
      '#f3a469',
      '#f7c978',
    ],
    options: {},
  },
  summer: { colors: ['#fdbb2d', '#22c1c3'], options: {} },
  rainbow: {
    colors: ['#ff0100', '#ff0000'],
    options: { interpolation: 'hsv', hsvSpin: 'long', padEnd: 0.1 },
  },
  pastel: {
    colors: ['#74ebd5', '#74ecd5'],
    options: { interpolation: 'hsv', hsvSpin: 'long', padEnd: 0.1 },
  },
} as const;

export const COLOR_SCHEMES = Object.keys(gradients) as ColorScheme[];

export function getColors(count: number, colorScheme?: ColorScheme) {
  const { colors, options }: GradientConfig = gradients[colorScheme ?? getColorOfDay()];
  const paddedCount = count + (options.padEnd ? Math.ceil(count * options.padEnd) : 0);

  if (paddedCount < colors.length) {
    return colors;
  }

  const gradient = tinygradient(colors as string[]);
  const tinyColors =
    options.interpolation === 'hsv'
      ? gradient.hsv(paddedCount, options.hsvSpin ?? false)
      : gradient.rgb(paddedCount);

  return tinyColors.map((c) => c.toHexString());
}

function getColorOfDay(): ColorScheme {
  const date = new Date();
  const index = date.getDate() + date.getMonth() * 30 + date.getFullYear() * 360;
  return COLOR_SCHEMES[index % COLOR_SCHEMES.length];
}
