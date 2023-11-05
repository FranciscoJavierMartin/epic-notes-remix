import { type SVGProps } from 'react';
import { cn } from '@/utils/misc';
import href from './icon.svg';
export { href };

const sizeClassName = {
	font: 'w-[1em] h-[1em]',
	xs: 'w-3 h-3',
	sm: 'w-4 h-4',
	md: 'w-5 h-5',
	lg: 'w-6 h-6',
	xl: 'w-7 h-7',
} as const;

type Size = keyof typeof sizeClassName;

const childrenSizeClassName = {
	font: 'gap-1',
	xs: 'gap-1',
	sm: 'gap-1',
	md: 'gap-2',
	lg: 'gap-2',
	xl: 'gap-3',
} satisfies Record<Size, string>;

export function Icon({
	name,
	size = 'font',
	className,
	children,
	...props
}: SVGProps<SVGSVGElement> & { name: IconName; size?: Size }) {
	return children ? (
		<span className={`inline-flex ${childrenSizeClassName[size]}`}>
			<Icon name={name} size={size} className={className} {...props} />
			{children}
		</span>
	) : (
		<svg
			{...props}
			className={cn(sizeClassName[size], 'inline self-center', className)}
		>
			<use href={`${href}#${name}`} />
		</svg>
	);
}

export type IconName =
	| 'arrow-left'
	| 'arrow-right'
	| 'avatar'
	| 'camera'
	| 'check'
	| 'clock'
	| 'cross-1'
	| 'exit'
	| 'file-text'
	| 'laptop'
	| 'lock-closed'
	| 'lock-open-1'
	| 'magnifying-glass'
	| 'moon'
	| 'pencil-1'
	| 'pencil-2'
	| 'plus'
	| 'reset'
	| 'sun'
	| 'trash'
	| 'update';
