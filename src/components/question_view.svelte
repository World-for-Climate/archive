<script context="module">
    const name = 'QuestionView';
</script>

<script>
    import {question_store, id_map_store} from "../stores.js"

    export let question_id;
    export let expanded = true;

    $: question = $question_store[$id_map_store[question_id].index];
</script>

<div class="card bg-base-100 shadow-xl outline outline-accent-content">
    <div class="card-body">
        <h2 class="card-title">{question.title}</h2>
        <h3 class="font-bold text-sm">{question.author}</h3>
        {#if question.body}
            <p>{question.body}</p>
        {/if}

        {#if !expanded }
            <div class="card-actions justify-end">
                <div class="btn btn-outline">{question.votes} votes</div>
                <a href="/questions/{question_id}" class="btn btn-primary">See {question.answers?.length ?? 0}
                    Answers</a>
            </div>
        {:else }
            {#each question.answers ?? [] as answer}
                <div class="card bg-base-100 shadow-xl outline outline-accent-content">
                    <div class="card-body">
                        <h2 class="card-title">{answer.title}</h2>
                        <h3 class="font-bold text-sm">{answer.author}</h3>
                        {#if answer.body}
                            <p>{answer.body}</p>
                        {/if}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>
