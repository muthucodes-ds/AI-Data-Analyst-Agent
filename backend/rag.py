import os
import time
import uuid

from dotenv import load_dotenv
from sqlalchemy import text

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_postgres import PGVector

from database import engine


# ==========================================
# ENVIRONMENT CONFIGURATION
# ==========================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is missing")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is missing")


# ==========================================
# DATABASE CONNECTION
# ==========================================

VECTOR_DATABASE_URL = DATABASE_URL.replace(
    "postgresql+psycopg2://",
    "postgresql+psycopg://"
)


# ==========================================
# GEMINI EMBEDDINGS
# ==========================================

embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-001",
    google_api_key=GEMINI_API_KEY
)


# ==========================================
# PGVECTOR STORE
# ==========================================

vector_store = PGVector(
    embeddings=embeddings,
    collection_name="dataset_embeddings",
    connection=VECTOR_DATABASE_URL,
    use_jsonb=True,
)


# ==========================================
# DATASET IDENTIFIER
# ==========================================

def generate_dataset_id(filename, file_hash=None):

    identifier = file_hash or filename

    return str(
        uuid.uuid5(
            uuid.NAMESPACE_URL,
            identifier
        )
    )


# ==========================================
# GET EXISTING EMBEDDING ROW NUMBERS
# ==========================================

def get_existing_row_numbers(filename, dataset_id=None):

    query = text("""
        SELECT
            (e.cmetadata->>'row_number')::integer
        FROM langchain_pg_embedding AS e
        INNER JOIN langchain_pg_collection AS c
            ON e.collection_id = c.uuid
        WHERE c.name = :collection_name
          AND e.cmetadata->>'filename' = :filename
          AND (
              CAST(:dataset_id AS TEXT) IS NULL
              OR e.cmetadata->>'dataset_id' = :dataset_id
          )
          AND e.cmetadata->>'row_number' ~ '^[0-9]+$'
    """)

    with engine.connect() as connection:

        results = connection.execute(
            query,
            {
                "collection_name": "dataset_embeddings",
                "filename": filename,
                "dataset_id": dataset_id
            }
        )

        return {row[0] for row in results}

# ==========================================
# STORE DATASET EMBEDDINGS
# ==========================================

def store_dataset_embeddings(texts, metadata):

    if not texts:
        return 0

    ids = [
        str(uuid.uuid5(
            uuid.NAMESPACE_URL,
            f"{meta['dataset_id']}:{meta['row_number']}"
        ))
        for meta in metadata
    ]

    max_retries = 5

    for attempt in range(max_retries):

        try:

            vector_store.add_texts(
                texts=texts,
                metadatas=metadata,
                ids=ids
            )

            return len(texts)

        except Exception as e:

            if "429" in str(e) and attempt < max_retries - 1:

                wait_time = 35

                print(
                    f"Gemini rate limit reached. "
                    f"Waiting {wait_time} seconds..."
                )

                time.sleep(wait_time)

            else:
                raise

    return 0


# ==========================================
# RAG SEMANTIC SEARCH
# ==========================================

def search_dataset_embeddings(
    question,
    filename,
    dataset_id=None,
    k=5
):

    if not question or not question.strip():
        return []

    search_filter = {
        "filename": filename
    }

    if dataset_id:
        search_filter["dataset_id"] = dataset_id

    try:

        results = vector_store.similarity_search(
            query=question,
            k=k,
            filter={
                "$and": [
                    {"filename": {"$eq": filename}},
                    *(
                        [{"dataset_id": {"$eq": dataset_id}}]
                        if dataset_id else []
                    )
                ]
            }
        )

        return results

    except Exception as e:

        print("RAG Search Error:", str(e))
        raise


# ==========================================
# FORMAT RETRIEVED DOCUMENTS
# ==========================================

def format_retrieved_documents(documents):

    if not documents:
        return "No relevant dataset information found."

    context = []

    for document in documents:

        row_number = document.metadata.get(
            "row_number",
            "Unknown"
        )

        context.append(
            f"Dataset Row {row_number}:\n"
            f"{document.page_content}"
        )

    return "\n\n".join(context)
