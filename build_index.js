import pkg from 'pg'
import Cursor from 'pg-cursor'
import Fuse from 'fuse.js'
import * as fs from "fs";
import * as cliProgress from "cli-progress";

const {Client} = pkg;

async function main() {
    const client = new Client({
        ssl: {
            rejectUnauthorized: false,
        }
    })
    await client.connect()

    const questions_count = await client.query("SELECT COUNT(questions.id) FROM questions WHERE questions.deleted_at IS NULL");
    const questions_cursor = await client.query(new Cursor(`
        SELECT questions.id,
               questions.updated_at,
               TRIM(public_name) as author,
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
          AND questions.id IS NOT NULL
        GROUP BY questions.id, questions.updated_at, author, title, body
        ORDER BY questions.updated_at DESC
    `))

    let questions = [];

    const progress = new cliProgress.SingleBar({}, cliProgress.Presets.legacy)
    progress.start(questions_count.rows[0].count, 0, "fetching questions...")
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const rows = await questions_cursor.read(100)
        if (rows.length === 0) {
            break
        }

        questions = questions.concat(rows)
        progress.increment(rows.length)
    }
    progress.stop();

    let id_map = {}
    for (let i = 0; i < questions.length; i++) {
        id_map[questions[i].id] = {
            "type": "question",
            "index": i,
        }
    }

    const answers_count = await client.query("SELECT COUNT(id) FROM answers WHERE deleted_at IS NULL");
    const progress2 = new cliProgress.SingleBar({}, cliProgress.Presets.legacy)
    progress2.start(answers_count, 0, "fetching answers...")
    const answers_cursor = await client.query(new Cursor(`
        SELECT answers.id,
               answers.updated_at,
               question_id,
               TRIM(public_name)       as author,
               NULLIF(TRIM(title), '') as title,
               NULLIF(TRIM(body), '')  as body,
               count(uv.answer_id)     as votes
        FROM answers
                 LEFT JOIN public.users u on u.id = answers.author_id AND u.deleted_at IS NULL
                 RIGHT JOIN user_answer_votes uv on uv.answer_id = answers.id

        WHERE answers.deleted_at IS NULL

        GROUP BY answers.id, question_id, answers.updated_at, author, title, body
        ORDER BY answers.updated_at DESC
    `))

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const rows = await answers_cursor.read(100)
        if (rows.length === 0) {
            break
        }

        for (const row of rows) {
            if (!id_map[row.question_id]) {
                continue
            }

            if (!questions[id_map[row.question_id].index].answers) {
                questions[id_map[row.question_id].index].answers = []
            }

            questions[id_map[row.question_id].index].answers.push({
                id: row.id,
                updated_at: row.updated_at,
                author: row.author,
                title: row.title,
                body: row.body,
                votes: row.votes
            })

            id_map[row.id] = {
                "type": "answer",
                "index": questions[id_map[row.question_id].index].answers.length - 1,
                "question_id": row.question_id,
                "question_index": id_map[row.question_id].index,
            }
        }

        progress2.increment(rows.length)
    }
    progress2.stop();
    await client.end()

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
    fs.writeFileSync("src/questions.json", JSON.stringify(questions))
    fs.writeFileSync("src/id_map.json", JSON.stringify(id_map))
}

function build_routes(questions) {
    const BASE_PATH = "src/routes/questions/"

    const progress = new cliProgress.SingleBar({}, cliProgress.Presets.legacy)
    progress.start(questions.length, 0)

    for (const question of questions) {
        if (question.id) {
            fs.mkdirSync(BASE_PATH + question.id, {recursive: true});
            fs.writeFileSync(BASE_PATH + question.id + "/+page.svelte", "<script>import QuestionView from \"../../../components/question_view.svelte\"</script><QuestionView question_id=\"" + question.id + "\"/>")
        }

        progress.increment(1, question.id)
    }

    progress.stop()
}

main().then(() => {
})