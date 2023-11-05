import React from 'react';
import { useSpinDelay } from 'spin-delay';
import { type ButtonProps, Button } from './button';
import { cn } from '@/utils/misc';
import { Icon } from './icon';
import { Tooltip, TooltipProvider, TooltipTrigger } from './tooltip';

export const StatusButton = React.forwardRef<
	HTMLButtonElement,
	ButtonProps & {
		status: 'pending' | 'success' | 'error' | 'idle';
		message?: string | null;
		spinDelay?: Parameters<typeof useSpinDelay>[1];
	}
>(
	(
		{ message, status = 'idle', className, children, spinDelay, ...props },
		ref,
	) => {
		const delayedPending = useSpinDelay(status === 'pending', {
			delay: 400,
			minDuration: 300,
			...spinDelay,
		});

		const companion = {
			pending: delayedPending ? (
				<div className='inline-flex h-6 w-6 items-center justify-center'>
					<Icon name='update' className='animate-spin' />
				</div>
			) : null,
			success: (
				<div className='inline-flex h-6 w-6 items-center justify-center'>
					<Icon name='check' />
				</div>
			),
			error: (
				<div className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive'>
					<Icon name='cross-1' className='text-destructive-foreground' />
				</div>
			),
			idle: null,
		}[status];

		return (
			<Button
				ref={ref}
				className={cn('flex justify-center gap-4', className)}
				{...props}
			>
				<div>{children}</div>
				{message ? (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger>{companion}</TooltipTrigger>
							<TooltipTrigger>{message}</TooltipTrigger>
						</Tooltip>
					</TooltipProvider>
				) : (
					companion
				)}
			</Button>
		);
	},
);

StatusButton.displayName = 'Button';
