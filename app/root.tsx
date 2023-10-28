import type { LinksFunction } from '@remix-run/node';
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react';
import favicon from '@/assets/favicon.svg';
import fontStylesheetUrl from '@/styles/font.css';
import tailwindStylesheetUrl from '@/styles/tailwind.css';
import { cssBundleHref } from '@remix-run/css-bundle';

export const links: LinksFunction = () =>
	[
		{ rel: 'icon', type: 'image/svg+xml', href: favicon },
		{ rel: 'stylesheet', href: fontStylesheetUrl },
		{ rel: 'stylesheet', href: tailwindStylesheetUrl },
		cssBundleHref ? { rel: 'stylesheet', href: cssBundleHref } : null!,
	].filter(Boolean);

export default function App() {
	return (
		<html lang='en' className='h-full overflow-x-hidden'>
			<head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<Meta />
				<Links />
			</head>
			<body className='flex h-full flex-col justify-between bg-background text-foreground'>
				<Outlet />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
