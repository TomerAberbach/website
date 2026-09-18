declare module 'vitest/browser' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface BrowserCommands {
    renderThumbnail: (postId: string) => Promise<string>
    getGraph: () => Promise<string>
  }
}

export {}
