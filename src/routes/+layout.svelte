<script>
    import "../app.pcss";
    import {query_store} from "../stores.js";
    import ThemeSelect from "../components/theme_select.svelte"
</script>

<nav class="navbar bg-base-100">
    <div class="flex-1">
        <a class="btn btn-ghost text-xl" href="/">
            <div class="w-10 rounded-full">
                <img alt="World for Climate logo" src="/favicon.png">
            </div>
            World for Climate <span class="border-l-2 pl-2">archive</span></a>
    </div>
    <div class="flex-none gap-2">
        <div class="form-control">
            <input bind:value={$query_store} class="input input-bordered w-24 md:w-auto" placeholder="Search"
                   type="text"/>
        </div>

        <ThemeSelect/>
    </div>
</nav>

<slot></slot>