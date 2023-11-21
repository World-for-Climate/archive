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

    const cursor = await client.query(new Cursor(`
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
        const rows = await cursor.read(100)
        if (rows.length === 0) {
            break
        }

        questions = questions.concat(rows)
        progress.increment(rows.length)
    }
    progress.stop();

    const progress2 = new cliProgress.SingleBar({}, cliProgress.Presets.legacy)
    progress2.start(questions.length, 0, "fetching answers...")
    for (const question of questions) {
        const res = await client.query(`
            SELECT answers.id,
                   answers.updated_at,
                   TRIM(public_name) as author,
                   NULLIF(TRIM(title), '') as title,
                   NULLIF(TRIM(body), '')  as body,
                   count(uv.answer_id)     as votes
            FROM answers
                     LEFT JOIN public.users u on u.id = answers.author_id AND u.deleted_at IS NULL
                     RIGHT JOIN user_answer_votes uv on uv.answer_id = answers.id

            WHERE answers.deleted_at IS NULL
              AND question_id = $1

            GROUP BY answers.id, answers.updated_at, author, title, body
            ORDER BY answers.updated_at DESC
        `, [question.id])

        question.answers = res.rows
        progress2.increment();
    }
    progress2.stop();
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
            fs.writeFileSync(BASE_PATH + question.id + "/+page.svelte", "<script>import QuestionView from \"../../../components/question_view.svelte\"</script><QuestionView question_id=" + question.id + "/>")
        }

        progress.increment(1, question.id)
    }

    progress.stop()
}

main().then(() => {
})