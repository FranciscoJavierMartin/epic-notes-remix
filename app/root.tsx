import React from 'react';
import os from 'node:os';
import { json, type LinksFunction } from '@remix-run/node';
import {
	Link,
	Links,
	LiveReload,
	Meta,
	type MetaFunction,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
	useMatches,
} from '@remix-run/react';
import { cssBundleHref } from '@remix-run/css-bundle';
import { HoneypotProvider } from 'remix-utils/honeypot/react';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { GeneralErrorBoundary } from '@/components/error-boundary';
import { SearchBar } from '@/components/search-bar';
import fontStylesheetUrl from '@/styles/font.css';
import tailwindStylesheetUrl from '@/styles/tailwind.css';
import favicon from '@/assets/favicon.svg';
import { honeypot } from '@/utils/honeypot.server';
import { csrf } from '@/utils/csrf.server';

export const links: LinksFunction = () =>
	[
		{ rel: 'icon', type: 'image/svg+xml', href: favicon },
		{ rel: 'stylesheet', href: fontStylesheetUrl },
		{ rel: 'stylesheet', href: tailwindStylesheetUrl },
		cssBundleHref ? { rel: 'stylesheet', href: cssBundleHref } : null!,
	].filter(Boolean);

export async function loader() {
	const honeyProps = honeypot.getInputProps();
	const [csrfToken, csrfCookieHeader] = await csrf.commitToken();

	return json(
		{ username: os.userInfo().username, honeyProps, csrfToken },
		{ headers: csrfCookieHeader ? { 'set-cookie': csrfCookieHeader } : {} },
	);
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'Epic Notes' },
		{ name: 'description', content: "Your own captain's log" },
	];
};

function Document({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en' className='h-full overflow-x-hidden'>
			<head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<Meta />
				<Links />
			</head>
			<body className='flex h-full flex-col justify-between bg-background text-foreground'>
				{children}
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}

function App() {
	const data = useLoaderData<typeof loader>();
	const matches = useMatches();
	const isOnSearchPage = matches.find((m) => m.id === 'routes/users+/index');

	return (
		<Document>
			<header className='container mx-auto py-6'>
				<nav className='flex justify-between items-center gap-6'>
					<Link to='/'>
						<div className='font-light'>epic</div>
						<div className='font-bold'>notes</div>
					</Link>
					{isOnSearchPage ? null : (
						<div className='ml-auto max-w-sm flex-1'>
							<SearchBar status='idle' />
						</div>
					)}
					<Link className='underline' to='/users/kody/notes'>
						Kody's Notes
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
		</Document>
	);
}

export default function AppWithProviders() {
	const data = useLoaderData<typeof loader>();

	return (
		<AuthenticityTokenProvider token={data.csrfToken}>
			<HoneypotProvider {...data.honeyProps}>
				<App />
			</HoneypotProvider>
		</AuthenticityTokenProvider>
	);
}

export function ErrorBoundary() {
	return (
		<Document>
			<div className='flex-1'>
				<GeneralErrorBoundary />
			</div>
		</Document>
	);
}
