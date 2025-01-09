import tinygradient from 'tinygradient';

// See: https://github.com/bokub/gradient-string/blob/465e86c8499a7f427c45afb1861f1444a2db74b9/src/index.ts#L166
export const gradients = {
  mind: (count: number) => toColors(tinygradient(['#473b7b', '#3584a7', '#30d2be']).rgb(count)),
  pastel: (count: number) => toColors(tinygradient(['#74ebd5', '#74ecd5']).hsv(count, 'long')),
  passion: (count: number) => toColors(tinygradient(['#f43b47', '#453a94']).rgb(count)),
  retro: (count: number) => toColors(tinygradient(['#4150AB', '#AE6F97', '#EFCB84']).rgb(count)),
};

function toColors(colors: tinycolor.Instance[]) {
  return colors.map((c) => c.toHexString());
}
