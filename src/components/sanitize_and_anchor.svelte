<script>
	import anchorme from 'anchorme';
	import { sanitize } from '@jill64/universal-sanitizer';

	export let input;
	export let a_classes = 'font-bold underline';
	export let target = '_blank';

	function transform_path(path) {
		if (!path) return '';
		if (path.length < 20) {
			return path;
		}
		return path.substring(0, 17) + '...';
	}
</script>

{@html sanitize(
	anchorme({
		input: input,
		options: {
			attributes: {
				target,
				class: a_classes
			},
			specialTransform: [
				{
					test: /^https:\/\//,
					transform: (str, props) =>
						`<a target="${target}" class="${a_classes}" href="${str}">${props.host}${transform_path(props.path)}</a>`
				}
			],
			exclude: (string) => string.startsWith('file://')
		}
	}),
	{
		sanitizeHtml: {
			allowedTags: ['a'],
			allowedAttributes: {
				a: ['href', 'target', 'class']
			}
		},
		dompurify: { ALLOWED_TAGS: ['a', '#text'], KEEP_CONTENT: false }
	}
)}
