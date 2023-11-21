import {writable} from 'svelte/store';
import * as search_index_data from "./search_index.json"
import * as id_map_data from "./id_map.json"
import * as questions_data from "./questions.json"
import Fuse from "fuse.js";

const question_store = writable(questions_data.default);
const id_map_store = writable(id_map_data.default);
const search_index = Fuse.parseIndex(search_index_data.default)
const search_index_store = writable(new Fuse(questions_data.default, {
    includeMatches: true,
}, search_index));

const query_store = writable("")
const topics_filter_store = writable([])

export {
    question_store, id_map_store, search_index_store, query_store, topics_filter_store
}