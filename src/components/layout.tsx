import type { ReactNode } from 'react'
import { ExternalLink, InternalLink } from './link'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className='flex flex-1 flex-col space-y-12 md:space-y-14 text-slate-800'>
      <Header />
      <main className='flex flex-1 flex-col'>{children}</main>
      <Footer />
    </div>
  )
}

function Header() {
  return (
    <header className='px-12 pt-12 md:px-16 md:pt-16'>
      <InternalLink href='/' className='focus-ring underlined'>
        <h1 className='inline text-2xl font-bold'>Tomer Aberbach</h1>
      </InternalLink>
    </header>
  )
}

function Footer() {
  return (
    <footer className='mx-auto flex flex-col items-center space-y-3 px-12 pb-12 text-sm text-slate-500 md:px-16 md:pb-16'>
      <p className='text-center'>
        ©&nbsp;Tomer&nbsp;Aberbach. All&nbsp;rights&nbsp;reserved.
      </p>
      <ul className='flex items-center space-x-3'>
        <li>
          <GitHubIcon />
        </li>
        <li>
          <SpotifyIcon />
        </li>
        <li>
          <TwitterIcon />
        </li>
        <li>
          <LinkedInIcon />
        </li>
      </ul>
    </footer>
  )
}

function GitHubIcon() {
  return (
    <IconLink title='GitHub' href='https://github.com/TomerAberbach'>
      <path d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' />
    </IconLink>
  )
}

function SpotifyIcon() {
  return (
    <IconLink
      title='Spotify'
      href='https://open.spotify.com/artist/0XwEUC5NdlGHZ9jpfHNeB7'
    >
      <path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' />
    </IconLink>
  )
}

function TwitterIcon() {
  return (
    <IconLink title='Twitter' href='https://twitter.com/TomerAberbach'>
      <path d='M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' />
    </IconLink>
  )
}

function LinkedInIcon() {
  return (
    <IconLink title='LinkedIn' href='https://www.linkedin.com/in/tomer-a'>
      <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
    </IconLink>
  )
}

function IconLink({
  title,
  href,
  children,
}: {
  title: string
  href: string
  children: ReactNode
}) {
  return (
    <ExternalLink href={href} className='focus-ring inline-block'>
      <svg
        role='img'
        viewBox='0 0 24 24'
        xmlns='http://www.w3.org/2000/svg'
        className='w-7 fill-slate-500 hover:fill-slate-600'
      >
        <title>{title}</title>
        {children}
      </svg>
    </ExternalLink>
  )
}
