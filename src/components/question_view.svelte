<script context="module">
	import { base } from '$app/paths';

	const name = 'QuestionView';
</script>

<script>
	import { question_store, id_map_store } from '../stores.js';
	import SanitizeAndAnchor from './sanitize_and_anchor.svelte';

	export let question_id;
	export let expanded = true;

	$: question = $question_store[$id_map_store[question_id].index];
</script>

<div class="card bg-base-100 shadow-xl border border-accent-content">
	<div class="card-body">
		<h2 class="card-title">
			<SanitizeAndAnchor input={question.title} />
		</h2>
		<h3 class="font-bold text-primary text-sm">{question.author}</h3>
		<span class="font-mono text-base-content/50 text-sm">
			{new Date(Date.parse(question.updated_at)).toLocaleString()}
		</span>
		{#if question.body}
			<p>
				<SanitizeAndAnchor input={question.body} />
			</p>
		{/if}

		{#if !expanded}
			<div class="card-actions justify-end">
				<div class="btn btn-outline">{question.votes} votes</div>
				<a href="{base}/questions/{question_id}" class="btn btn-primary"
					>See {question.answers?.length ?? 0}
					Answers</a
				>
			</div>
		{:else}
			{#each question.answers ?? [] as answer}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title">
							<SanitizeAndAnchor input={answer.title} />
						</h2>
						<h3 class="font-bold text-primary text-sm">{answer.author}</h3>
						<span class="font-mono text-base-content/50 text-sm">
							{new Date(Date.parse(answer.updated_at)).toLocaleString()}
						</span>
						{#if answer.body}
							<p>
								<SanitizeAndAnchor input={answer.body} />
							</p>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
