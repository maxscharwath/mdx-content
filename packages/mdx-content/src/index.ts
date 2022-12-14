import * as fs from 'fs';
import { z, ZodIssueCode } from 'zod'
import {globbyStream} from 'globby';
import type {ProcessorOptions} from '@mdx-js/esbuild/lib';
import * as path from 'path';
import * as process from 'process';
import {bundleMDX} from 'mdx-bundler';
import {getMDXComponent} from 'mdx-bundler/client';

type MdxOptions = ProcessorOptions;

type Pluralize<T extends string> = T extends `${infer A}y` ? `${A}ies` : T extends `${infer A}s` ? `${A}s` : `${T}s`;

function pluralize<T extends string>(str: T): Pluralize<T> {
	return (str.endsWith('s') ? str : str.endsWith('y') ? str.slice(0, -1) + 'ies' : `${str}s`) as Pluralize<T>;
}

type Awaitable<T> = T | Promise<T>;

type DocumentOption<Name extends string = string> = {
	name: Name;
	filePathPattern: string;
	fields: Record<string, (zod: typeof z) => z.ZodFirstPartySchemaTypes>;
	computedFields: Record<string, (source: Document<DocumentOption, MetadataField<DocumentOption>>) => Awaitable<any>>;
};

type MetadataField<D extends DocumentOption> = {
	[K in keyof D['fields']]: z.infer<ReturnType<D['fields'][K]>>
};

type MetadataComputedField<D extends DocumentOption> = {
	[K in keyof D['computedFields']]: Awaited<ReturnType<D['computedFields'][K]>>
};

type Metadata<D extends DocumentOption> = MetadataField<D> & MetadataComputedField<D>;

type AllMetadata<D extends DocumentOption> = Metadata<D> | MetadataField<D> | MetadataComputedField<D>;

type Document<D extends DocumentOption = DocumentOption, M extends AllMetadata<D> = Metadata<D>> = M & {
	file: {
		path: string;
		filename: string;
	};
	body: {
		raw: string;
		code: string;
	};
};

export type DocumentType<D extends DocumentOption = DocumentOption> = {
	document: D;
	compute: (options: ComputeDocumentOptions) => Promise<Array<Document<D>>>;
};

type SourceOptions<DocumentTypes = readonly DocumentType[]> = {
	documentTypes: DocumentTypes;
	documentFolder: string;
	mdxOptions?: MdxOptions;
};

type Source<S extends SourceOptions> = {
	[K in Pluralize<S['documentTypes'][number]['document']['name']>]:
	S['documentTypes'] extends ReadonlyArray<DocumentType<infer D>> ?
		D extends DocumentOption<infer N> ?
			Pluralize<N> extends K ? Promise<Array<Document<D>>> : never
			: never
		: never
};

/**
 * Infer the Document type from the DocumentType type
 */
export type InferDocument<Dt extends DocumentType> = Dt extends DocumentType<infer D> ? Document<D> : never;

type ComputeDocumentOptions = {
	cwd: string;
	mdxOptions?: MdxOptions;
};

async function computeDocuments<T extends DocumentOption & ComputeDocumentOptions>(options: T) {
	const schema = z.object(
		Object.fromEntries(
			Object.entries(options.fields).map(([key, value]) => [key, value(z)]),
		),
	);
	const documents: Array<Document<T, Metadata<T>>> = [];
	for await (const globPath of globbyStream(options.filePathPattern, {cwd: options.cwd})) {
		const documentPath = path.join(options.cwd, globPath.toString());
		const source = await fs.promises.readFile(documentPath, 'utf8');
		const {code, matter} = await bundleMDX({
			source,
			cwd: options.cwd,
			mdxOptions: processorOptions => ({
				...processorOptions,
				...options.mdxOptions,
				remarkPlugins: [...(processorOptions.remarkPlugins ?? []), ...options.mdxOptions?.remarkPlugins ?? []],
				rehypePlugins: [...(processorOptions.rehypePlugins ?? []), ...options.mdxOptions?.rehypePlugins ?? []],
			}),
		});
		const safeParse = schema.safeParse(matter.data);

		if (!safeParse.success) {
			console.error(`Error parsing ${documentPath}:`);
			for (const issue of safeParse.error.issues) {
				console.error(`Field ${issue.path.join('.')} ${issue.message}`)
			}
			continue;
		}

		const result: Document<T, MetadataField<T>> = {
			...safeParse.data as MetadataField<T>,
			file: {
				path: documentPath,
				filename: path.basename(documentPath),
			},
			body: {
				raw: matter.content,
				code,
			},
		};

		documents.push({
			...result,
			...Object.fromEntries(
				await Promise.all(
					Object.entries(options.computedFields)
						// eslint-disable-next-line @typescript-eslint/no-unsafe-return
						.map(async ([key, fn]) => [key, await fn(result)]),
				),
			),
		});
	}
	return documents;
}

/**
 * Define a new DocumentType
 * @param document
 */
export function defineDocumentType<T extends DocumentOption>(document: Readonly<T>): DocumentType<T> {
	return {
		document,
		async compute(options) {
			return computeDocuments({
				...options,
				...document,
			});
		},
	};
}

export function makeSource<T extends SourceOptions>(options: T): Source<T> {
	return Object.fromEntries(
		options.documentTypes.map(dt => [
			pluralize(dt.document.name),
			dt.compute({
				cwd: path.resolve(process.cwd(), options.documentFolder),
				mdxOptions: options.mdxOptions,
			}),
		]),
	) as Source<T>;
}

export function useDocument(document: Document) {
	return getMDXComponent(document.body.code);
}
