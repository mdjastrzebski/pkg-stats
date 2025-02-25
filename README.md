## PKG Stats

Beautiful NPM package download stats.

### Single package

```
npx pkg-stats react
```

<div align='center'>
  <img src="https://raw.githubusercontent.com/mdjastrzebski/pkg-stats/main/docs/public/example-package.jpg" alt="Display single package stats" style="max-width: 762px; aspect-ratio: 1524x1108;" />
</div>

#### Options:

- `--major`, `--minor`, `--patch` - group by major, minor or patch version
- `--top <number>` (alias `-t`) - show top N versions
- `--color <scheme>` (alias `-c`) - specify color scheme
  - available schemes: `atlas`, `cristal`, `fruit`, `insta`, `mind`, `morning`, `passion`, `pastel`, `rainbow`, `retro`, `summer`, `teen`, `vice`

### Compare packages

```
npx pkg-stats moment date-fns dayjs luxon @js-joda/core
```

<div align='center'>
  <img src="https://raw.githubusercontent.com/mdjastrzebski/pkg-stats/main/docs/public/example-compare.jpg" alt="Compare package stats" style="max-width: 762px; aspect-ratio: 1524x1108;" />
</div>

#### Options:

- `--color <scheme>` (alias `-c`) - specify color scheme
