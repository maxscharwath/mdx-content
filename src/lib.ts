import matter from 'gray-matter';
import * as fs from 'fs';
import type {ZodFirstPartySchemaTypes} from 'zod';
import {z} from 'zod';
import {globbyStream} from 'globby';
import {compile} from '@mdx-js/mdx';
import type {VFile} from '@mdx-js/mdx/lib/compile';

type Pluralize<T extends string> = T extends `${infer A}y` ? `${A}ies` : `${T}s`;
function pluralize<T extends string>(str: T): Pluralize<T> {
	return (str.endsWith('y') ? str.slice(0, -1) + 'ies' : str + 's') as Pluralize<T>;
}

type DocumentOption<Name extends string = string> = {
	name: Name;
	filePathPattern: string;
	fields: Record<string, (x: typeof z) => ZodFirstPartySchemaTypes>;
	computedFields: Record<string, (source: Document<DocumentOption, MetadataField<DocumentOption>>) => any | Promise<any>>;
};

type MetadataField<D extends DocumentOption> = {
	[K in keyof D['fields']]: z.infer<ReturnType<D['fields'][K]>>
};

type MetadataComputedField<D extends DocumentOption> = {
	[K in keyof D['computedFields']]: Awaited<ReturnType<D['computedFields'][K]>>
};

type Metadata<D extends DocumentOption> = MetadataField<D> & MetadataComputedField<D>;

type AllMetadata<D extends DocumentOption> = Metadata<D> | MetadataField<D> | MetadataComputedField<D>;

type Document<D extends DocumentOption = DocumentOption, M extends AllMetadata<D> = Metadata<D>> = {
	metadata: M;
	path: string;
	body: {
		raw: string;
		compiled: VFile;
	};
};

type DocumentType<D extends DocumentOption = DocumentOption> = {
	document: D;
	getAll: () => Array<Document<D>>;
};

type SourceOptions<DocumentTypes = readonly DocumentType[]> = {
	documentTypes: DocumentTypes;
	cwd: string;
};

type Source<S extends SourceOptions> = {
	[K in Pluralize<S['documentTypes'][number]['document']['name']>]:
	S['documentTypes'] extends ReadonlyArray<DocumentType<infer D>> ?
		D extends DocumentOption<infer N> ?
			Pluralize<N> extends K ? Array<Document<D>> : never
			: never
		: never
};

/**
 * Infer the Document type from the DocumentType type
 */
export type InferDocument<Dt extends DocumentType> = Dt extends DocumentType<infer D> ? Document<D> : never;

async function computeDocuments<T extends DocumentOption>(options: T, cwd: string) {
	const schema = z.object(
		Object.fromEntries(
			Object.entries(options.fields).map(([key, value]) => [key, value(z)]),
		),
	);
	const documents: Array<Document<T, Metadata<T>>> = [];

	for await (const path of globbyStream(options.filePathPattern, {cwd})) {
		const fileContent = await fs.promises.readFile(path, 'utf8');
		const {content, data} = matter(fileContent);
		const safeParse = schema.safeParse(data);

		if (!safeParse.success) {
			continue;
		}

		const result: Document<T, MetadataField<T>> = {
			metadata: safeParse.data as MetadataField<T>,
			path: path.toString(),
			body: {
				raw: content,
				compiled: await compile(content),
			},
		};

		documents.push({
			...result,
			metadata: {
				...result.metadata,
				...Object.fromEntries(
					await Promise.all(
						Object.entries(options.computedFields)
							.map(async ([key, fn]) => [key, await fn(result)]),
					),
				),
			},
		});
	}

	return documents;
}

/**
 * Define a new DocumentType
 * @param document
 */
export async function defineDocumentType<T extends DocumentOption>(document: Readonly<T>): Promise<DocumentType<T>> {
	const documents = await computeDocuments(document, process.cwd());
	return {
		document,
		getAll: () => documents,
	};
}

export function makeSource<T extends SourceOptions>(options: T): Source<T> {
	return Object.fromEntries(
		options.documentTypes.map(dt => [pluralize(dt.document.name), dt.getAll()]),
	) as Source<T>;
}
