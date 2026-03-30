import Document, { Html, Head, Main, NextScript } from 'next/document'

const setThemeScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {
    // Ignore errors
  }
})();
`

const setSiteSettingsScript = `
(function() {
  try {
    var raw = localStorage.getItem('site-settings');
    if (!raw) return;
    var settings = JSON.parse(raw);
    var siteName = (settings && (settings.siteName || settings.site_name)) || '';
    var faviconUrl = (settings && (settings.faviconUrl || settings.favicon_url)) || '';
    if (siteName) {
      document.title = siteName;
    }
    if (faviconUrl) {
      var link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  } catch (e) {
    // Ignore errors
  }
})();
`

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <script dangerouslySetInnerHTML={{ __html: setThemeScript }} />
          <script dangerouslySetInnerHTML={{ __html: setSiteSettingsScript }} />
          <link rel="stylesheet" href="/flag-icons.css" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
