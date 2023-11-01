import os from 'node:os';
import { json, type LinksFunction } from '@remix-run/node';
import {
	Link,
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
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

export async function loader() {
	return json({ username: os.userInfo().username });
}

export default function App() {
	const data = useLoaderData<typeof loader>();

	return (
		<html lang='en' className='h-full overflow-x-hidden'>
			<head>
				<title>Epic Notes</title>
				<meta name='description' content="Your own captain's log" />
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<Meta />
				<Links />
			</head>
			<body className='flex h-full flex-col justify-between bg-background text-foreground'>
				<header className='container mx-auto py-6'>
					<nav className='flex justify-between'>
						<Link to='/'>
							<div className='font-light'>epic</div>
							<div className='font-bold'>notes</div>
						</Link>
					</nav>
				</header>
				<div className='flex-1'>
					<Outlet />
				</div>
				<div className='container mx-auto flex justify-between'>
					<Link to='/'>
						<div className='font-light'>epic</div>
						<div className='font-bold'>notes</div>
					</Link>
					<p>Built with ♥️ by {data.username}</p>
				</div>
				<div className='h-5' />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
