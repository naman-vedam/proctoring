import ThemeProviderWrapper from './theme-provider';

export const metadata = {
  title: 'Fullscreen API POC',
  description: 'Testing fullscreen mode and exit detection',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <ThemeProviderWrapper>
          {children}
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}