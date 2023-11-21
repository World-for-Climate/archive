<script>
    import QuestionView from "../components/question_view.svelte"
    import {query_store, question_store, search_index_store} from "../stores.js"
    import topics_filter_store from "../topics_store.js"

    $: topics = $question_store.flatMap((q) => q.topics).filter((t, i, a) => t !== null && a.indexOf(t) === i).sort();
    $: unselected_topics = topics.filter(t => !$topics_filter_store.includes(t));
    $: questions = ($query_store === ""
        ? $question_store
        : $search_index_store.search($query_store).map(match => match.item))
        .filter(q => $topics_filter_store.length === 0 || q.topics.some(t => $topics_filter_store.includes(t)));

    let topics_open = false;
</script>

<div class="container mx-auto">
    <div class="flex flex-row">
        <div class="collapse collapse-arrow border">
            <input bind:checked={topics_open} type="checkbox"/>
            <div class="collapse-title font-medium">
                {#if $topics_filter_store.length > 0 && !topics_open}
                    {#each $topics_filter_store as t}
                        <button class="btn btn-xs btn-outline btn-primary m-1 rounded-full btn-active"
                                on:click={() => topics_filter_store.remove(t)}
                        >{t}</button>
                    {/each}
                {:else}
                    Click here to filter by topics
                {/if}
            </div>
            <div class="collapse-content">
                {#each $topics_filter_store as t}
                    <button class="btn btn-xs btn-outline btn-primary m-1 rounded-full btn-active"
                            on:click={() => topics_filter_store.remove(t)}
                    >{t}</button>
                {/each}
                {#each unselected_topics as t}
                    <button class="btn btn-xs btn-outline btn-primary m-1 rounded-full"
                            on:click={() => topics_filter_store.add(t)}
                    >{t}</button>
                {/each}
            </div>
        </div>
        <button class="btn btn-warning ml-2 mt-2 mb-auto" on:click={() => {
            $query_store = ""
            topics_filter_store.set([])
        }}>Reset Search
        </button>
    </div>

    {#each questions as q}
        <div class="my-4">
            <QuestionView question_id={q.id} expanded={false}/>
        </div>
    {/each}
</div>
