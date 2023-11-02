import { useEffect, useState } from 'react';
import { json, type DataFunctionArgs, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusButton } from '@/components/ui/status-button';
import { GeneralErrorBoundary } from '@/components/error-boundary';
import { db } from '@/utils/db.server';
import { invariantResponse, useIsSubmitting } from '@/utils/misc';

type ActionErrors = {
	formErrors: Array<string>;
	fieldErrors: {
		title: Array<string>;
		content: Array<string>;
	};
};

const titleMaxLength = 100;
const contentMaxLength = 10000;

function useHydrated() {
	const [isHydrated, setIsHydrated] = useState<boolean>(false);

	useEffect(() => {
		setIsHydrated(true);
	}, []);

	return isHydrated;
}

export async function loader({ params }: DataFunctionArgs) {
	const note = db.note.findFirst({
		where: {
			id: {
				equals: params.noteId,
			},
		},
	});

	invariantResponse(note, 'Note not found', { status: 404 });

	return json({ note: { title: note.title, content: note.content } });
}

export async function action({ params, request }: DataFunctionArgs) {
	invariantResponse(params.noteId, 'noteId param is required');

	const formData = await request.formData();
	const title = formData.get('title');
	const content = formData.get('content');

	invariantResponse(typeof title === 'string', 'title must be a string');
	invariantResponse(typeof content === 'string', 'content must be a string');

	const errors: ActionErrors = {
		formErrors: [],
		fieldErrors: {
			title: [],
			content: [],
		},
	};

	if (title === '') {
		errors.fieldErrors.title.push('Title is required');
	}
	if (title.length > titleMaxLength) {
		errors.fieldErrors.title.push('Title must be at most 100 characters');
	}
	if (content === '') {
		errors.fieldErrors.content.push('Content is required');
	}
	if (content.length > contentMaxLength) {
		errors.fieldErrors.content.push('Content must be at most 10000 characters');
	}

	const hasErrors =
		errors.formErrors.length ||
		Object.values(errors.fieldErrors).some((fieldErrors) => fieldErrors.length);

	console.log(hasErrors);
	if (hasErrors) {
		return json({ status: 'error', errors } as const, { status: 400 });
	}

	db.note.update({
		where: { id: { equals: params.noteId } },
		data: { title, content },
	});

	return redirect(`/users/${params.username}/notes/${params.noteId}`);
}

function ErrorList({
	id,
	errors,
}: {
	id?: string;
	errors?: Array<string> | null;
}) {
	return errors?.length ? (
		<ul id={id} className='flex flex-col gap-1'>
			{errors.map((error, i) => (
				<li key={i} className='text-[10px] text-foreground-destructive'>
					{error}
				</li>
			))}
		</ul>
	) : null;
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No note with the id "{params.noteId}" exists</p>
				),
			}}
		/>
	);
}

export default function NoteEdit() {
	const data = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const isSubmitting = useIsSubmitting();
	const isHydrated = useHydrated();

	const fieldErrors =
		actionData?.status === 'error' ? actionData.errors.fieldErrors : null;
	const formErrors =
		actionData?.status === 'error' ? actionData.errors.formErrors : null;

	const formHasErrors = Boolean(formErrors?.length);
	const formErrorId = formHasErrors ? 'form-error' : undefined;
	const titleHasErrors = Boolean(fieldErrors?.title.length);
	const titleErrorId = titleHasErrors ? 'title-error' : undefined;
	const contentHasErrors = Boolean(fieldErrors?.content.length);
	const contentErrorId = contentHasErrors ? 'content-error' : undefined;

	return (
		<div>
			<Form
				id='note-editor'
				method='POST'
				noValidate={isHydrated}
				aria-invalid={formHasErrors || undefined}
				aria-describedby={formErrorId}
				className='flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-10 pb-28 pt-12'
			>
				<div className='flex flex-col gap-1'>
					<div>
						<Label htmlFor='note-title'>Title</Label>
						<Input
							id='note-title'
							name='title'
							defaultValue={data.note.title}
							required
							maxLength={titleMaxLength}
							aria-invalid={titleHasErrors || undefined}
							aria-describedby={titleErrorId}
							autoFocus
						/>
						<div className='min-h-[32px] px-4 pb-3 pt-1'>
							<ErrorList id={titleErrorId} errors={fieldErrors?.title} />
						</div>
					</div>
					<div>
						<Label htmlFor='note-content'>Content</Label>
						<Textarea
							id='note-content'
							name='content'
							defaultValue={data.note.content}
							required
							maxLength={contentMaxLength}
							aria-invalid={contentHasErrors || undefined}
							aria-describedby={contentErrorId}
						/>
						<div className='min-h-[32px] px-4 pb-3 pt-1'>
							<ErrorList id={contentErrorId} errors={fieldErrors?.content} />
						</div>
					</div>
				</div>
				<ErrorList id={formErrorId} errors={formErrors} />
			</Form>
			<div className='floating-toolbar'>
				<Button form='note-editor' variant='destructive' type='reset'>
					Reset
				</Button>
				<StatusButton
					form='note-editor'
					type='submit'
					disabled={isSubmitting}
					status={isSubmitting ? 'pending' : 'idle'}
				>
					Submit
				</StatusButton>
			</div>
		</div>
	);
}
