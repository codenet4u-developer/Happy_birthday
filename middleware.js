// This file protects your whole site with a username + password.
// It runs on Vercel's edge, before any of your HTML/CSS/JS loads.
// You do NOT need to change index.html, style.css, or script.js at all.

export const config = {
  // Apply this check to every page on the site
  matcher: '/((?!favicon.ico).*)',
};

export default function middleware(request) {
  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const encoded = authHeader.split(' ')[1];
    const decoded = atob(encoded); // "user:pass"
    const [user, pass] = decoded.split(':');

    const validUser = process.env.SITE_USER;
    const validPass = process.env.SITE_PASS;

    if (user === validUser && pass === validPass) {
      // Correct login -> let the request through to index.html etc.
      return;
    }
  }

  // No login yet, or wrong login -> ask the browser for a password
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Private site"',
    },
  });
}
