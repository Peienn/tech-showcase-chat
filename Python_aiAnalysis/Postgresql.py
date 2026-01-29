print('11')
import psycopg2
import json

conn = psycopg2.connect(
    host="my-postgres",
    port=5432,
    dbname="ChatRoom",
    user="chat_user",
    password="chat_user"
)

def save_analysis(batch_id, messages, analysis):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO analysis_results (batch_id, messages, analysis)
            VALUES (%s, %s, %s)
            """,
            (
                batch_id,
                json.dumps(messages),
                analysis
            )
        )
        conn.commit()
