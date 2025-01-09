import tinygradient from 'tinygradient';

// See: https://github.com/bokub/gradient-string/blob/465e86c8499a7f427c45afb1861f1444a2db74b9/src/index.ts#L166
export const gradients = {
  mind: (count: number) => toColors(tinygradient(['#473b7b', '#3584a7', '#30d2be']).rgb(count)),
  pastel: (count: number) => toColors(tinygradient(['#74ebd5', '#74ecd5']).hsv(count, 'long')),
  retro: (count: number) =>
    toColors(
      tinygradient([
        '#3f51b1',
        '#5a55ae',
        '#7b5fac',
        '#8f6aae',
        '#a86aa4',
        '#cc6b8e',
        '#f18271',
        '#f3a469',
        '#f7c978',
      ]).rgb(count),
    ),
};

function toColors(colors: tinycolor.Instance[]) {
  return colors.map((c) => c.toHexString());
}
