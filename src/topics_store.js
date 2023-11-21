import {writable} from 'svelte/store';

const {subscribe, update} = writable([]);

export default {
    subscribe,
    add(topic) {
        update((prev) => {
            return [...prev, topic].sort()
        })
    },
    remove(topic) {
        update((prev) => {
            return prev.filter(t => t !== topic);
        })
    }
};