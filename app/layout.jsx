import './polyfill'
import './globals.css'
import { AudioProvider } from './context/AudioContext'

export const metadata = {
  title: 'Audiobook Library',
  description: 'Your personal audiobook collection',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AudioProvider>
          {children}
        </AudioProvider>
      </body>
    </html>
  )
}
