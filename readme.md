<p align="center">
	<img alt="Rice Bowl" src="public/images/icon-512.png" width="90">
	<h2 align="center">Next PWA Template</h2>
</p>

<p align="center">Fluffless app template to inspire less</p>

<p align="center">
	<a href="https://next-pwa-template.now.sh">Live demo</a>
</p>

<p align="center">
	<a href="https://web.dev/measure">
		<img alt="100% lighthouse scores" src="https://img.shields.io/badge/lighthouse-100%25-845EF7.svg?logo=lighthouse&logoColor=white&style=flat-square" />
	</a>
</p>

## Features

- ✨ Fluffless PWA using Next 13
- 🌗 Lovely night/day themes
- 🦄 Easily removable [nice-to-haves](#use-only-what-you-need)
- 📱 Native-like mobile experience
- 📦 Neatly wrapped like that avocado you got for christmas

## Getting started

1. [Use this template](https://github.com/mvllow/next-pwa-template/generate)
2. Replace `public/images` with your own
3. Enjoy ✨

### Google Drive / OAuth setup (client-only)

This app uses a client-only Google sign-in (gapi) and stores backups in the user's Google Drive. Follow these steps to allow sign-in from your testing origin (for example an ngrok tunnel).

1. Create a Google Cloud project and an OAuth 2.0 Client ID (Application type: Web application).

2. In the OAuth client configuration, set the following:
	 - Authorized JavaScript origins:
		 - https://cunning-panda-nearby.ngrok-free.app
		 - http://localhost:3000 (optional for local testing)
	 - Authorized redirect URIs:
		 - For client-side popup-based gapi sign-in you typically don't need a redirect URI, but if your flow requires it, add:
			 - https://cunning-panda-nearby.ngrok-free.app

	 Note: Use your actual ngrok subdomain if it differs from the example above.

3. Copy the **Client ID** and place it in your local `.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

4. Start the dev server and open `/login`. Click "Continue with Google" to sign in.

Security notes:
 - This repository uses a client-only (gapi) sign-in. No tokens are stored on a remote server by default.
 - Backups are written to the user's Google Drive inside a folder named `FinanceTrackerBackups`.
 - On sign-out the app will attempt a final backup, then sign the user out and delete the local IndexedDB.


## Use only what you need

Fluffless doesn't mean "start with nothing". The goal of this template is to be an entry into maintainable apps.

**The essentials**

- Typescript, made easy with Next.js
- [tailwindcss](https://github.com/tailwindlabs/tailwindcss) for utility-first styling
- [next-pwa](https://github.com/shadowwalker/next-pwa) for offline support

**Nice to haves**

- [next-themes](https://github.com/pacocoursey/next-themes) or similar for low stress theming

## Gallery

### Desktop

<img width="1728" alt="Rice Bowl PWA on macOS in dark mode" src="https://github.com/mvllow/next-pwa-template/assets/1474821/889bef1b-af58-4efa-b1f3-3ea021ec9760">

### Mobile

<img width="360" alt="Rice Bowl PWA on iOS in light mode" src="https://github.com/mvllow/next-pwa-template/assets/1474821/1f0fa36e-23c7-4bcf-aa6e-f447559cae62" />

<img width="360" alt="Rice Bowl PWA on iOS in dark mode" src="https://github.com/mvllow/next-pwa-template/assets/1474821/2fac61d0-dc29-4022-8b39-003306f80fb4" />
