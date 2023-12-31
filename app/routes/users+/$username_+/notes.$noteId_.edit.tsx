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
import { conform, useFieldList, useForm, list } from '@conform-to/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { createId as cuid } from '@paralleldrive/cuid2';
import { GeneralErrorBoundary } from '@/components/error-boundary';
import { ErrorList, InputField, TextareaField } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';
import { StatusButton } from '@/components/ui/status-button';
import { ImageChooser } from '@/components/ui/image-chooser';
import { prisma } from '@/utils/db.server';
import { invariantResponse, useIsPending } from '@/utils/misc';
import { validateCSRF } from '@/utils/csrf.server';

const titleMinLength = 1;
const titleMaxLength = 100;
const contentMinLength = 10;
const contentMaxLength = 10000;
const MAX_UPLOAD_SIZE = 1024 * 1024 * 3; // 3MB

export const ImageFieldsetSchema = z.object({
	id: z.string().optional(),
	file: z
		.instanceof(File)
		.refine(
			(file) => file.size <= MAX_UPLOAD_SIZE,
			'File size must be less than 3MB',
		)
		.optional(),
	altText: z.string().optional(),
});

type ImageFieldset = z.infer<typeof ImageFieldsetSchema>;

function imageHasFile(
	image: ImageFieldset,
): image is ImageFieldset & { file: NonNullable<ImageFieldset['file']> } {
	return Boolean(image.file?.size);
}

function imageHasId(
	image: ImageFieldset,
): image is ImageFieldset & { id: NonNullable<ImageFieldset['id']> } {
	return Boolean(image.id);
}

const NoteEditorSchema = z.object({
	title: z.string().min(titleMinLength).max(titleMaxLength),
	content: z.string().min(contentMinLength).max(contentMaxLength),
	images: z.array(ImageFieldsetSchema).max(5).optional(),
});

export async function loader({ params }: DataFunctionArgs) {
	const note = await prisma.note.findFirst({
		where: { id: params.noteId },
		select: {
			title: true,
			content: true,
			images: {
				select: { id: true, altText: true },
			},
		},
	});

	invariantResponse(note, 'Note not found', { status: 404 });

	return json({ note });
}

export async function action({ params, request }: DataFunctionArgs) {
	const { noteId } = params;
	invariantResponse(noteId, 'noteId param is required');

	const formData = await parseMultipartFormData(
		request,
		createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
	);

	await validateCSRF(formData, request.headers);

	const submission = await parse(formData, {
		schema: NoteEditorSchema.transform(async ({ images = [], ...data }) => {
			return {
				...data,
				imageUpdates: await Promise.all(
					images.filter(imageHasId).map(async (image) => {
						return imageHasFile(image)
							? {
									id: image.id,
									altText: image.altText,
									contentType: image.file.type,
									blob: Buffer.from(await image.file.arrayBuffer()),
							  }
							: {
									id: image.id,
									altText: image.altText,
							  };
					}),
				),
				newImages: await Promise.all(
					images
						.filter(imageHasFile)
						.filter((image) => !image.id)
						.map(async (image) => ({
							altText: image.altText,
							contentType: image.file.type,
							blob: Buffer.from(await image.file.arrayBuffer()),
						})),
				),
			};
		}),
		async: true,
	});

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const);
	}

	if (!submission.value) {
		return json({ status: 'error', submission } as const, {
			status: 400,
		});
	}

	const {
		title,
		content,
		imageUpdates = [],
		newImages = [],
	} = submission.value;

	await prisma.note.update({
		select: { id: true },
		where: { id: noteId },
		data: {
			title,
			content,
			images: {
				deleteMany: {
					id: {
						notIn: imageUpdates.map((i) => i.id),
					},
				},
				updateMany: imageUpdates.map((updates) => ({
					where: { id: updates.id },
					data: {
						...updates,
						id: updates.blob ? cuid() : updates.id,
					},
				})),
				create: newImages,
			},
		},
	});

	return redirect(`/users/${params.username}/notes/${noteId}`);
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
	const isPending = useIsPending();

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
			images: data.note.images.length ? data.note.images : [{}],
		},
	});

	const imageList = useFieldList(form.ref, fields.images);

	return (
		<div className='absolute inset-0'>
			<Form
				method='POST'
				encType='multipart/form-data'
				className='flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-10 pb-28 pt-12'
				{...form.props}
			>
				<AuthenticityTokenInput />
				<button type='submit' className='hidden' />
				<div className='flex flex-col gap-1'>
					<InputField
						labelProps={{ children: 'Title' }}
						inputProps={{ autoFocus: true, ...conform.input(fields.title) }}
						errors={fields.title.errors}
					/>
					<TextareaField
						labelProps={{ children: 'Content' }}
						textareaProps={{ ...conform.textarea(fields.content) }}
						errors={fields.content.errors}
					/>
					<div>
						<Label>Images</Label>
						<ul className='flex flex-col gap-4'>
							{imageList.map((image, index) => (
								<li
									key={image.key}
									className='relative border-b-2 border-muted-foreground pb-4'
								>
									<button
										className='text-foreground-destructive absolute right-0 top-0'
										{...list.remove(fields.images.name, { index })}
									>
										<span aria-hidden>
											<Icon name='cross-1' />
										</span>{' '}
										<span className='sr-only'>Remove image {index + 1}</span>
									</button>
									<ImageChooser config={image} />
								</li>
							))}
						</ul>
					</div>
					<Button
						className='mt-3'
						{...list.insert(fields.images.name, { defaultValue: {} })}
					>
						<span aria-hidden>
							<Icon name='plus'>Image</Icon>
						</span>{' '}
						<span className='sr-only'>Add image</span>
					</Button>
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
					disabled={isPending}
					status={isPending ? 'pending' : 'idle'}
				>
					Submit
				</StatusButton>
			</div>
		</div>
	);
}
