import {writable} from 'svelte/store';

const {subscribe, set, update} = writable([]);

export default {
    subscribe,
    set,
    add(topic) {
        update((prev) => {
            return [...prev, topic].sort()
        })
    },
    remove(topic) {
        update((prev) => {
            return prev.filter(t => t !== topic);
        })
    },
};