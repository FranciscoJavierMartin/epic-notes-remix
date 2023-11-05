import { useFormAction, useNavigation } from '@remix-run/react';
import { type ClassValue, clsx } from 'clsx';
import { useEffect, useMemo, useRef } from 'react';
import { twMerge } from 'tailwind-merge';
import userFallback from '@/assets/user.png';

/**
 * Does its best to get a string error message from an unknown error.
 */
export function getErrorMessage(error: unknown) {
	if (typeof error === 'string') return error;
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message;
	}
	console.error('Unable to get error message for error', error);
	return 'Unknown Error';
}

/**
 * A handy utility that makes constructing class names easier.
 * It also merges tailwind classes.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Provide a condition and if that condition is falsey, this throws a 400
 * Response with the given message.
 *
 * inspired by invariant from 'tiny-invariant'
 *
 * @example
 * invariantResponse(typeof value === 'string', `value must be a string`)
 *
 * @param condition The condition to check
 * @param message The message to throw
 * @param responseInit Additional response init options if a response is thrown
 *
 * @throws {Response} if condition is falsey
 */
export function invariantResponse(
	condition: any,
	message?: string | (() => string),
	responseInit?: ResponseInit,
): asserts condition {
	if (!condition) {
		throw new Response(
			typeof message === 'function'
				? message()
				: message ||
				  'An invariant failed, please provide a message to explain why.',
			{ status: 400, ...responseInit },
		);
	}
}

/**
 * Returns true if the current navigation is submitting the current route's
 * form. Defaults to the current route's form action and method POST.
 */
export function useIsSubmitting({
	formAction,
	formMethod = 'POST',
}: {
	formAction?: string;
	formMethod?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
} = {}) {
	const contextualFormAction = useFormAction();
	const navigation = useNavigation();
	return (
		navigation.state === 'submitting' &&
		navigation.formAction === (formAction ?? contextualFormAction) &&
		navigation.formMethod === formMethod
	);
}

/**
 * Returns true if the current navigation is submitting the current route's
 * form. Defaults to the current route's form action and method POST.
 *
 * Defaults state to 'non-idle'
 *
 * NOTE: the default formAction will include query params, but the
 * navigation.formAction will not, so don't use the default formAction if you
 * want to know if a form is submitting without specific query params.
 */
export function useIsPending({
	formAction,
	formMethod = 'POST',
	state = 'non-idle',
}: {
	formAction?: string;
	formMethod?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
	state?: 'submitting' | 'loading' | 'non-idle';
} = {}) {
	const contextualFormAction = useFormAction();
	const navigation = useNavigation();
	const isPendingState =
		state === 'non-idle'
			? navigation.state !== 'idle'
			: navigation.state === state;
	return (
		isPendingState &&
		navigation.formAction === (formAction ?? contextualFormAction) &&
		navigation.formMethod === formMethod
	);
}

/**
 * Simple debounce implementation
 */
function debounce<Callback extends (...args: Parameters<Callback>) => void>(
	fn: Callback,
	delay: number,
) {
	let timer: ReturnType<typeof setTimeout> | null = null;
	return (...args: Parameters<Callback>) => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			fn(...args);
		}, delay);
	};
}

/**
 * Debounce a callback function
 */
export function useDebounce<
	Callback extends (...args: Parameters<Callback>) => ReturnType<Callback>,
>(callback: Callback, delay: number) {
	const callbackRef = useRef(callback);
	useEffect(() => {
		callbackRef.current = callback;
	});
	return useMemo(
		() =>
			debounce(
				(...args: Parameters<Callback>) => callbackRef.current(...args),
				delay,
			),
		[delay],
	);
}

export function getUserImgSrc(imageId?: string | null) {
	return imageId ? `/resources/images/${imageId}` : userFallback;
}

export function getNoteImgSrc(imageId: string) {
	return `/resources/images/${imageId}`;
}
