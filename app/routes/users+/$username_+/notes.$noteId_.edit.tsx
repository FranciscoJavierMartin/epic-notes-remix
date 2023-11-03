import {
	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
	json,
	unstable_parseMultipartFormData as parseMultipartFormData,
	redirect,
	type DataFunctionArgs,
} from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { getFieldsetConstraint, parse } from '@conform-to/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusButton } from '@/components/ui/status-button';
import { GeneralErrorBoundary } from '@/components/error-boundary';
import { db } from '@/utils/db.server';
import { invariantResponse, useIsSubmitting } from '@/utils/misc';
import { conform, useForm } from '@conform-to/react';
import { ImageChooser } from '@/components/ui/image-chooser';

const titleMaxLength = 100;
const contentMaxLength = 10000;
const MAX_UPLOAD_SIZE = 1024 * 1024 * 3; // 3MB

const NoteEditorSchema = z.object({
	title: z.string().min(1).max(titleMaxLength),
	content: z.string().min(1).max(contentMaxLength),
});

export async function loader({ params }: DataFunctionArgs) {
	const note = db.note.findFirst({
		where: {
			id: {
				equals: params.noteId,
			},
		},
	});

	invariantResponse(note, 'Note not found', { status: 404 });

	return json({
		note: {
			title: note.title,
			content: note.content,
			images: note.images?.map((image) => ({
				id: image.id,
				altText: image.altText,
			})),
		},
	});
}

export async function action({ params, request }: DataFunctionArgs) {
	invariantResponse(params.noteId, 'noteId param is required');

	const formData = await parseMultipartFormData(
		request,
		createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
	);

	const submission = parse(formData, {
		schema: NoteEditorSchema,
	});

	if (!submission.value) {
		return json({ status: 'error', submission } as const, {
			status: 400,
		});
	}

	const { title, content } = submission.value;

	db.note.update({
		where: { id: { equals: params.noteId } },
		data: {
			title,
			content,
			images: [
				{
					// @ts-expect-error
					id: formData.get('imageId'),
					file: formData.get('file'),
					// @ts-expect-error
					altText: formData.get('altText'),
				},
			],
		},
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

	const [form, fields] = useForm({
		id: 'note-editor',
		constraint: getFieldsetConstraint(NoteEditorSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: NoteEditorSchema });
		},
		defaultValue: {
			title: data.note.title,
			content: data.note.content,
		},
	});

	return (
		<div>
			<Form
				method='POST'
				encType='multipart/form-data'
				className='flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-10 pb-28 pt-12'
				{...form.props}
			>
				<div className='flex flex-col gap-1'>
					<div>
						<Label htmlFor={fields.title.id}>Title</Label>
						<Input autoFocus {...conform.input(fields.title)} />
						<div className='min-h-[32px] px-4 pb-3 pt-1'>
							<ErrorList
								id={fields.title.errorId}
								errors={fields.title.errors}
							/>
						</div>
					</div>
					<div>
						<Label htmlFor={fields.content.id}>Content</Label>
						<Textarea {...conform.textarea(fields.content)} />
						<div className='min-h-[32px] px-4 pb-3 pt-1'>
							<ErrorList
								id={fields.content.errorId}
								errors={fields.content.errors}
							/>
						</div>
					</div>
					<div>
						<Label>Image</Label>
						<ImageChooser
							image={data.note.images?.length ? data.note.images[0] : undefined}
						/>
					</div>
				</div>
				<ErrorList id={form.errorId} errors={form.errors} />
			</Form>
			<div className='floating-toolbar'>
				<Button form={form.id} variant='destructive' type='reset'>
					Reset
				</Button>
				<StatusButton
					form={form.id}
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
