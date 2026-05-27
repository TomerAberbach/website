---
title: What I Worked On at Stainless
tags:
  [
    'api',
    'ai',
    'code',
    'cli',
    'c#',
    'engineering',
    'java',
    'kotlin',
    'libraries',
    'resume',
    'stainless',
  ]
dates:
  published: 2026-03-21
  updated: 2026-05-26
---

:::note

[Anthropic has acquired Stainless](https://www.anthropic.com/news/anthropic-acquires-stainless).
I'm now the tech lead of Anthropic's new SDKs team!

:::

At [Stainless](https://www.stainless.com), I built compiler-like generators that
transform [API specifications](https://www.openapis.org) into idiomatic client
libraries that feel as though they were hand-written by a language expert who
had the time to get it right.

I also served as the primary maintainer of the
[Anthropic](https://github.com/anthropics/anthropic-sdk-java) and
[OpenAI](https://github.com/openai/openai-java) Java SDKs, triaging issues,
reviewing PRs, and implementing features across both libraries.

I contributed to nearly every Stainless generator, but here are my notable
projects, ordered from most to least recent.

- Led the development of the
  [Stainless C# SDK generator](https://www.stainless.com/docs/sdks/csharp),
  mentoring a new engineer throughout and enabling
  [Anthropic](https://github.com/anthropics/anthropic-sdk-csharp),
  [Browserbase](https://github.com/browserbase/stagehand-net), and
  [10+ other companies](https://github.com/search?q=%22%5B%5C%22X-Stainless-Lang%5C%22%5D+%3D+%5C%22csharp%5C%22%22&type=code)
  to ship production C# SDKs.

- Pioneered a language-agnostic codegen framework that resolves name conflicts
  using graph coloring and serves as the foundation for a new generation of
  Stainless SDK generators, including the
  [C#](https://www.stainless.com/docs/sdks/csharp) and
  [PHP](https://www.stainless.com/docs/sdks/php) SDK generators.

- Conceived and built the initial prototype for the
  [Stainless API-to-CLI generator](https://www.stainless.com/docs/cli) before
  onboarding and transitioning ownership to a new engineer to complete. The
  generator now powers the
  [CLI for the Stainless API](https://www.stainless.com/docs/quickstart-cli)
  itself.

- Engineered a language-agnostic
  [breaking change detection system](https://www.stainless.com/docs/enterprise/breaking-change-detection)
  that statically validates public API contracts against proposed releases,
  enabling [Anthropic](https://github.com/anthropics),
  [Cloudflare](https://github.com/cloudflare), and
  [OpenAI](https://github.com/openai) to catch SDK interface regressions before
  they ship.

- Overhauled the Stainless [Java](https://www.stainless.com/docs/sdks/java) and
  [Kotlin](https://www.stainless.com/docs/sdks/kotlin) SDK generators,
  eliminating critical bugs, resolving design issues, closing feature gaps, and
  enabling [Anthropic](https://github.com/anthropics/anthropic-sdk-java),
  [Meta](https://github.com/llamastack/llama-stack-client-kotlin),
  [OpenAI](https://github.com/openai/openai-java), and
  [70+ other companies](<https://github.com/search?q=%2F%22X-Stainless-Lang%22%2C%20%22(java%7Ckotlin)%22%2F&type=code>)
  to ship production Java and Kotlin SDKs.

Wondering what I was up to before Stainless?
[Check out what I worked on at Google!](/what-i-worked-on-at-google)
