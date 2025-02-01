import type { ReactNode } from 'react'
import { ExternalLink } from './link.tsx'

export const ErrorView = ({
  message,
  children,
}: {
  message: string
  children: ReactNode
}) => (
  <div className='flex flex-1 flex-col items-center justify-center gap-5 text-center'>
    <h1 className='not-prose text-9xl font-semibold'>{message}</h1>
    <p className='text-3xl'>
      Oh no! It appears you’ve been{` `}
      <strong>
        <em>bamboozled!</em>
      </strong>
    </p>
    {children}
  </div>
)

export const ErrorCrashView = ({ error }: { error: unknown }) => {
  const stack = error instanceof Error ? error.stack : null

  let issueUrl = `https://github.com/TomerAberbach/website/issues/new?title=${encodeURIComponent(`Website error`)}`
  if (stack) {
    issueUrl += `&body=${encodeURIComponent(`\`\`\`\n${stack}\n\`\`\``)}`
  }

  return (
    <ErrorView message='Error'>
      <ExternalLink href={issueUrl} className='text-lg font-medium underline'>
        File an issue
      </ExternalLink>
      {stack ? (
        // Use the system monospace font because we subset our custom monospace
        // font based on the website content and the stack may contain
        // characters not included in the subset font.
        <pre className='mt-3 max-w-full overflow-auto rounded-md bg-yellow-100 p-4 text-left font-system-mono'>
          {stack}
        </pre>
      ) : null}
    </ErrorView>
  )
}
