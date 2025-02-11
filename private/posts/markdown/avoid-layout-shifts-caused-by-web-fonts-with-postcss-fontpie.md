---
title: 'Avoid Layout Shifts Caused by Web Fonts With PostCSS Fontpie'
tags: ['code', 'fonts', 'javascript', 'performance', 'postcss']
referencedBy:
  'https://x.com/PostCSS/status/1663251368771977234': '@PostCSS on X'
  'https://frontender-ua.medium.com/frontend-weekly-digest-312-22-28-may-2023-6dc34fa067d6':
    'Frontend Weekly Digest: Issue 312'
dates:
  published: 2023-05-24
---

When your CSS references a web font before it finishes downloading, the browser
renders text using a fallback system font instead, causing a
[layout shift](https://web.dev/cls) if the text container's height changes once
it's rendered with the web font.

[Optimizing your font files](https://simonhearne.com/2021/layout-shifts-webfonts#optimise-font-files)
and using an
[intelligent font loading strategy](https://simonhearne.com/2021/layout-shifts-webfonts#deliver-your-fonts-fast)
can eliminate layout shifts, but only if the web font is not immediately used on
the page. Otherwise you have to ensure the text container's height doesn't
change. [Fontpie](https://github.com/pixel-point/fontpie) can help with this.
It's a tool for generating CSS that adjusts a fallback font's metrics so it
takes up the same amount of space as your web font. The result is no layout
shifts even if the font is immediately used!

Part of what makes Fontpie great is that it's framework agnostic, but that also
means it's a bit manual to use and I wanted something I could easily integrate
into this website's build. I was already using
[PostCSS](https://github.com/postcss/postcss) so I decided to make a Fontpie
PostCSS plugin. The result is
[`postcss-fontpie`](https://github.com/TomerAberbach/postcss-fontpie). And now
generating fallback font metrics for my web fonts is as easy as adding the
following to my
[PostCSS config](https://github.com/TomerAberbach/website/blob/main/postcss.config.js):

```js title=postcss.config.js
const { join } = require(`path`)

module.exports = {
  plugins: [
    // ...
    require(`postcss-fontpie`)({
      fontTypes: {
        dm: `mono`,
        'Kantumruy Pro': `sans-serif`,
      },
      srcUrlToFilename: url => join(__dirname, `app/styles`, url),
    }),
    // ...
  ],
}
```

You can see the generated fallback font metrics in
[this website's CSS]($fonts.css) and their effects in the following
before-and-after GIFs:

:::horizontal

::gif[without-postcss-fontpie]{alt="Website's font load causing a layout shift"}

::gif[with-postcss-fontpie]{alt="Website's font load with no layout shift"}

:::

Check out
[`postcss-fontpie`'s usage example](https://github.com/TomerAberbach/postcss-fontpie#usage)
to use it in your own website!
