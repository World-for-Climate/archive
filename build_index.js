import pkg from 'pg'
import Fuse from 'fuse.js'
import * as fs from "fs";

const {Client} = pkg;

async function main() {
    const client = new Client({
        ssl: {
            rejectUnauthorized: false,
        }
    })
    await client.connect()

    const res = await client.query(`
        SELECT questions.id,
               questions.updated_at,
               TRIM(public_name)                                  as auther,
               NULLIF(TRIM(title), '')                            as title,
               NULLIF(TRIM(body), '')                             as body,
               array_remove(array_agg(DISTINCT t.label_en), NULL) as topics,
               count(uv.question_id)                              as votes
        FROM questions
                 LEFT JOIN public.users u on u.id = questions.author_id AND u.deleted_at IS NULL
                 RIGHT JOIN user_question_votes uv on uv.question_id = questions.id
                 FULL OUTER JOIN question_topics qt on qt.question_id = questions.id
                 LEFT JOIN topics t on t.id = qt.topic_id

        WHERE questions.deleted_at IS NULL

        GROUP BY questions.id, questions.created_at, questions.updated_at, auther, title, body
    `)
    let questions = res.rows;

    for (const question of questions) {
        const res = await client.query(`
            SELECT answers.id,
                   answers.updated_at,
                   TRIM(public_name)       as auther,
                   NULLIF(TRIM(title), '') as title,
                   NULLIF(TRIM(body), '')  as body,
                   count(uv.answer_id)     as votes
            FROM answers
                     LEFT JOIN public.users u on u.id = answers.author_id AND u.deleted_at IS NULL
                     RIGHT JOIN user_answer_votes uv on uv.answer_id = answers.id

            WHERE answers.deleted_at IS NULL
              AND question_id = $1

            GROUP BY answers.id, answers.updated_at, auther, title, body
        `, [question.id])

        question.answers = res.rows
    }
    await client.end()

    let id_map = {}
    for (let i = 0; i < questions.length; i++) {
        id_map[questions[i].id] = {
            "type": "question",
            "index": i,
        }

        for (let j = 0; j < questions[i].answers.length; j++) {
            id_map[questions[i].id] = {
                "type": "answer",
                "index": j,
                "question_id": questions[i].id,
                "question_index": i,
            }
        }
    }

    const question_index = Fuse.createIndex(
        [
            "id",
            "author",
            "title",
            "body",
            "topics",
            "answers.id",
            "answers.author",
            "answers.title",
            "answers.body",
        ],
        questions
    )

    build_routes(questions)

    fs.writeFileSync("src/search_index.json", JSON.stringify(question_index))
    fs.writeFileSync("src/id_map.json", JSON.stringify(id_map))
}

function build_routes(questions) {
    const BASE_PATH = "src/routes/questions/"

    for (const question of questions) {
        fs.mkdirSync(BASE_PATH + question.id, {recursive: true});
        fs.writeFileSync(BASE_PATH + question.id + "/+page.svelte", "<script>import QuestionView from \"../../../components/question_view.svelte\"</script><QuestionView question_id=" + question.id + "/>")
    }
}

main().then(() => {
})