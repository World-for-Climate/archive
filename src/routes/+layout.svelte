<script>
    import "../app.pcss";
    import {query_store} from "../stores.js";
    import ThemeSelect from "../components/theme_select.svelte"

    const debounce = (callback, wait = 300) => {
        let timeout

        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => callback(...args), wait);
        };
    };
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
            <input class="input input-bordered w-24 md:w-auto" on:keyup={debounce(e => {
                       $query_store = e.target.value
                   })} placeholder="Search"
                   type="text" value={$query_store}/>
        </div>

        <ThemeSelect/>
    </div>
</nav>

<slot></slot>