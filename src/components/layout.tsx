import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import { InternalLink, Link } from './link.tsx'
import { SITE_TITLE_AND_AUTHOR } from '~/services/meta.ts'
import logoSvgPath from '~/private/media/logo.svg'

const Layout = ({ children }: { children: ReactNode }) => (
  <div className='flex flex-1 flex-col gap-8 p-8 text-gray-800 sm:gap-y-10 sm:px-10 md:gap-y-16 md:px-16'>
    <Header />
    <main className='flex flex-1 flex-col'>{children}</main>
    <Footer />
  </div>
)

export default Layout

const Header = () => {
  const homeHref = useHomeHref()
  return (
    <header className='relative self-center'>
      <Logo className='-z-10 h-40 w-32 sm:h-[200px] sm:w-40' />
      {/* Ensures that the width of the `header` element matches its contents. */}
      <div className='invisible h-0 pl-2 text-2xl font-bold'>
        {SITE_TITLE_AND_AUTHOR}
      </div>
      <InternalLink
        href={homeHref}
        className='underlined absolute bottom-0 left-2 inline-block text-gray-800/90 focus:outline-hidden'
      >
        <h1 className='inline text-2xl leading-none font-bold whitespace-nowrap'>
          {SITE_TITLE_AND_AUTHOR}
        </h1>
      </InternalLink>
    </header>
  )
}

const Footer = () => {
  const homeHref = useHomeHref()
  return (
    <footer className='mx-auto flex flex-col items-center gap-y-3 text-xs text-gray-600'>
      <div className='flex h-[70px] items-end'>
        <p className='text-center'>
          ©&nbsp;
          <span className='relative inline-block'>
            <Logo className='absolute bottom-[0.3125rem] -left-[0.125rem] -z-10 h-[70px] w-14' />
            <InternalLink
              href={homeHref}
              className='underlined font-semibold text-gray-800'
            >
              Tomer&nbsp;Aberbach
            </InternalLink>
          </span>
          . All&nbsp;rights&nbsp;reserved.
        </p>
      </div>
      <ul className='flex items-center gap-x-3'>
        <li>
          <GitHubIcon />
        </li>
        <li>
          <SpotifyIcon />
        </li>
        <li>
          <XIcon />
        </li>
        <li>
          <LinkedInIcon />
        </li>
        <li>
          <JsonFeedIcon />
        </li>
        <li>
          <RssIcon />
        </li>
      </ul>
    </footer>
  )
}

const useHomeHref = () => {
  const location = useLocation()
  const postId = location.pathname.slice(1)
  if (!postId) {
    return `/`
  }

  return `/?post=${encodeURIComponent(postId)}`
}

const Logo = ({ className }: { className: string }) => (
  <img src={logoSvgPath} aria-label='Palm tree' className={className} />
)

const GitHubIcon = () => (
  <IconLink title='GitHub' href='https://github.com/TomerAberbach'>
    <path d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' />
  </IconLink>
)

const SpotifyIcon = () => (
  <IconLink
    title='Spotify'
    href='https://open.spotify.com/artist/0XwEUC5NdlGHZ9jpfHNeB7'
  >
    <path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' />
  </IconLink>
)

const XIcon = () => (
  <IconLink title='X' href='https://twitter.com/TomerAberbach'>
    <path d='M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z' />
  </IconLink>
)

const LinkedInIcon = () => (
  <IconLink title='LinkedIn' href='https://www.linkedin.com/in/tomer-a'>
    <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
  </IconLink>
)

const JsonFeedIcon = () => (
  <IconLink title='JSON Feed' href='/feed.json' reloadDocument>
    <path d='M21.773574 0q-.762182 0-1.298532.53634093-.53635.53634087-.53635 1.28439727 0 .7480542.522235 1.270282.522237.5222258 1.270304.5222258.748067 0 1.284418-.5222258.536349-.5222278.536349-1.270282 0-.7480564-.522237-1.28439727Q22.507528 0 21.773574 0ZM3.452981.47988515l-.9597848.95976725Q.15019243 3.7826164.00904769 5.7868404-.1320966 7.7910632 1.9286173 9.851743l2.314774 2.314735q1.2703033 1.298512 1.3691046 2.201824.098801.90331-.9456705 1.947765-.4516624.536341-.4375494 1.256167.014109.719827.5222368 1.227939.5081214.508112 1.2279595.522227.7198383.01411 1.2561879-.437541l.028224.02822q.705725-.705713 1.3267632-.903312.6210368-.197599 1.2844166.127027.663382.324628 1.510249 1.171483l2.681751 2.709937q2.117172 2.088906 4.163771 1.975993 2.0466-.112916 4.389605-2.455879l.931554-.959768-2.004256-2.032452-.508121.508113q-1.326761 1.326738-2.371232 1.340855-1.044472.01411-2.314774-1.256169l-3.161645-3.161586q-2.427688-2.427649-4.7706931-.479883l-.3105184-.310514q.9880139-1.185595.8892116-2.342963-.0988-1.15737-1.2844159-2.314736L4.8926553 7.6781474q-.8750982-.8750836-1.1432717-1.5949102-.2681764-.7198254.0282259-1.4537667.2964041-.7339414 1.1997307-1.6654819l.479891-.4798843zm14.05802 3.78261665q-.79041 0-1.312647.5363405-.522234.5363415-.522234 1.2843979 0 .7480534.522234 1.284395.522237.5363403 1.270303.5363403.748068 0 1.284419-.5363403.536349-.5363416.536349-1.284395 0-.7480564-.522236-1.2702822-.522235-.5222283-1.256188-.5504562ZM13.2202 8.5250029q-.762181 0-1.298531.5363411-.536352.5363419-.536352 1.284397 0 .748054.536352 1.284395.53635.536342 1.284416.536342.748067 0 1.284418-.536342.53635-.536341.53635-1.284395 0-.7480551-.53635-1.2702825-.536351-.5222274-1.270303-.5504556Z' />
  </IconLink>
)

const RssIcon = () => (
  <IconLink title='RSS' href='/rss.xml' reloadDocument>
    <path d='M19.199 24C19.199 13.467 10.533 4.8 0 4.8V0c13.165 0 24 10.835 24 24h-4.801zM3.291 17.415c1.814 0 3.293 1.479 3.293 3.295 0 1.813-1.485 3.29-3.301 3.29C1.47 24 0 22.526 0 20.71s1.475-3.294 3.291-3.295zM15.909 24h-4.665c0-6.169-5.075-11.245-11.244-11.245V8.09c8.727 0 15.909 7.184 15.909 15.91z' />
  </IconLink>
)

const IconLink = ({
  title,
  href,
  reloadDocument,
  children,
}: {
  title: string
  href: string
  reloadDocument?: boolean
  children: ReactNode
}) => (
  <Link
    href={href}
    reloadDocument={reloadDocument}
    className='inline-block hover:ring-3'
  >
    <svg
      role='img'
      aria-label={title}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      className='w-7 fill-gray-500 hover:fill-gray-600 sm:w-8'
    >
      <title>{title}</title>
      {children}
    </svg>
  </Link>
)
