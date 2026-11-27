from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text
from database import engine, SessionLocal
from models import UploadedFile

import pandas as pd
import io
import os
import re
import hashlib

from dotenv import load_dotenv
from google import genai
from google.genai import types

from rag import (
    store_dataset_embeddings,
    get_existing_row_numbers,
    generate_dataset_id,
    search_dataset_embeddings,
    format_retrieved_documents
)


# ==========================================
# GEMINI API CONFIGURATION
# ==========================================

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

gemini_client = genai.Client(api_key=api_key) if api_key else None

GEMINI_MODEL = "gemini-3.5-flash-lite"


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="AI Data Analyst Agent",
    description="AI-powered data analysis application",
    version="1.0.0"
)


# ==========================================
# CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# COMMON DATASET READER
# CSV / EXCEL SUPPORT
# ==========================================

def read_dataset(contents, filename):

    filename = (filename or "").lower()

    if filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))

    elif filename.endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(contents))

    else:
        raise ValueError(
            "Unsupported file format. Upload CSV, XLSX or XLS."
        )

    if df.empty:
        raise ValueError("Uploaded dataset is empty.")

    return df


# ==========================================
# DATASET ID GENERATOR
# ==========================================

def create_dataset_identifier(contents, filename):

    file_hash = hashlib.sha256(contents).hexdigest()

    return generate_dataset_id(
        filename,
        file_hash
    )


# ==========================================
# AI RESPONSE FORMAT NORMALIZER
# ==========================================

def format_ai_response(answer):

    if not answer:
        return "No response received from AI."

    answer = answer.replace("\r\n", "\n").strip()

    answer = re.sub(
        r'\s*(#{1,3}\s*(?:Answer|Results|Key Insight)\b)',
        r'\n\1\n',
        answer,
        flags=re.IGNORECASE
    )

    answer = re.sub(
        r'(?<!\n)\s+(?=\d+[.)]\s+)',
        '\n',
        answer
    )

    answer = re.sub(
        r'(?<!\n)\s+(?=[-*•]\s+)',
        '\n',
        answer
    )

    answer = re.sub(
        r'[ \t]+\n',
        '\n',
        answer
    )

    answer = re.sub(
        r'\n{3,}',
        '\n\n',
        answer
    )

    return answer.strip()


# ==========================================
# HOME API
# ==========================================

@app.get("/")
def home():

    return {
        "message": "Welcome to AI Data Analyst Agent",
        "status": "Running"
    }


# ==========================================
# HEALTH API
# ==========================================

@app.get("/health")
def health():

    return {
        "status": "Healthy",
        "project": "AI Data Analyst Agent",
        "gemini_configured": gemini_client is not None
    }


# ==========================================
# DATABASE TEST API
# ==========================================

@app.get("/db-test")
def database_test():

    try:

        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "success",
            "message": "PostgreSQL connected successfully"
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }


# ==========================================
# RAG DOCUMENT GENERATOR
# ==========================================

def generate_rag_documents(df):

    documents = []

    for index, row in df.iterrows():

        row_text = ", ".join(
            f"{column}: {value}"
            for column, value in row.items()
        )

        documents.append(
            f"Dataset Row {index + 1}: {row_text}"
        )

    return documents


# ==========================================
# RAG METADATA GENERATOR
# ==========================================

def generate_rag_metadata(df, filename, dataset_id):

    metadata = []

    for index in range(len(df)):

        metadata.append({
            "filename": filename,
            "dataset_id": dataset_id,
            "row_number": index + 1
        })

    return metadata


# ==========================================
# SAVE DATASET TO VECTOR DATABASE
# SKIP EXISTING EMBEDDINGS
# ==========================================

def save_dataset_to_vector_db(df, filename, dataset_id):

    texts = generate_rag_documents(df)

    metadata = generate_rag_metadata(
        df,
        filename,
        dataset_id
    )

    existing_rows = get_existing_row_numbers(
        filename,
        dataset_id
    )

    total_stored = 0
    skipped_rows = 0

    batch_size = 100

    for i in range(0, len(texts), batch_size):

        text_batch = texts[i:i + batch_size]

        metadata_batch = metadata[i:i + batch_size]

        new_texts = []
        new_metadata = []

        for document, meta in zip(
            text_batch,
            metadata_batch
        ):

            row_number = meta["row_number"]

            if row_number in existing_rows:

                skipped_rows += 1
                continue

            new_texts.append(document)
            new_metadata.append(meta)

        if new_texts:

            stored_count = store_dataset_embeddings(
                new_texts,
                new_metadata
            )

            total_stored += stored_count

            for meta in new_metadata:

                existing_rows.add(
                    meta["row_number"]
                )

    return {
        "stored_embeddings": total_stored,
        "skipped_embeddings": skipped_rows,
        "total_rows": len(df),
        "dataset_id": dataset_id
    }


# ==========================================
# FILE UPLOAD API
# CSV / EXCEL
# POSTGRESQL + RAG
# ==========================================

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    try:

        contents = await file.read()

        df = read_dataset(
            contents,
            file.filename
        )

        dataset_id = create_dataset_identifier(
            contents,
            file.filename
        )

        # ----------------------------------
        # SAVE FILE INFORMATION TO POSTGRESQL
        # ----------------------------------

        db = SessionLocal()

        try:

            uploaded = UploadedFile(
                filename=file.filename,
                total_rows=len(df),
                total_columns=len(df.columns),
                column_names=", ".join(
                    map(str, df.columns)
                )
            )

            db.add(uploaded)
            db.commit()

        except Exception:

            db.rollback()
            raise

        finally:

            db.close()

        # ----------------------------------
        # STORE RAG EMBEDDINGS
        # ----------------------------------

        rag_result = None
        rag_error = None

        try:

            rag_result = save_dataset_to_vector_db(
                df,
                file.filename,
                dataset_id
            )

        except Exception as e:

            rag_error = str(e)

        return {
            "message": "File uploaded successfully",
            "filename": file.filename,
            "rows": int(len(df)),
            "columns": int(len(df.columns)),
            "dataset_id": dataset_id,
            "rag": rag_result,
            "rag_error": rag_error,
            "success": True
        }

    except Exception as e:

        return {
            "error": str(e),
            "success": False
        }

# ==========================================
# DASHBOARD CHART + ANALYTICS API
# ==========================================

@app.post("/dashboard")
async def dashboard_data(file: UploadFile = File(...)):

    try:

        contents = await file.read()

        df = read_dataset(
            contents,
            file.filename
        )

        # ==================================
        # ANALYTICS RESULTS
        # ==================================

        result = {

            "filename": file.filename,

            "analytics_results": {
                "total_rows": int(df.shape[0]),
                "total_columns": int(df.shape[1])
            },

            # ==================================
            # COLUMN NAMES
            # ==================================

            "column_names": df.columns.tolist(),

            # ==================================
            # MISSING VALUES
            # ==================================

            "missing_values": {
                str(key): int(value)
                for key, value in df.isnull().sum().items()
            },

            # ==================================
            # DUPLICATE ROWS
            # ==================================

            "duplicate_rows": int(df.duplicated().sum()),

            # ==================================
            # EXISTING CHART DATA
            # ==================================

            "total_rows": int(df.shape[0]),
            "total_columns": int(df.shape[1]),
            "columns": df.columns.tolist(),

            "categorical_charts": {},
            "numerical_charts": {}
        }

        # ==================================
        # CATEGORICAL CHARTS
        # ==================================

        for column in df.select_dtypes(
            include=["object", "category", "bool"]
        ).columns:

            values = (
                df[column]
                .fillna("Missing")
                .value_counts()
                .head(10)
            )

            chart_type = (
                "pie" if len(values) <= 5 else "bar"
            )

            result["categorical_charts"][column] = {

                "chart_type": chart_type,

                "data": {
                    str(key): int(value)
                    for key, value in values.items()
                }
            }

        # ==================================
        # NUMERICAL CHARTS
        # ==================================

        for column in df.select_dtypes(
            include=["number"]
        ).columns:

            clean_data = df[column].dropna()

            if not clean_data.empty:

                histogram = pd.cut(
                    clean_data,
                    bins=10,
                    duplicates="drop"
                ).value_counts().sort_index()

                result["numerical_charts"][column] = {

                    "chart_type": "histogram",

                    "mean": float(clean_data.mean()),
                    "median": float(clean_data.median()),
                    "min": float(clean_data.min()),
                    "max": float(clean_data.max()),

                    "histogram": {
                        str(key): int(value)
                        for key, value in histogram.items()
                    }
                }

        result["success"] = True

        result["message"] = "Analysis Completed Successfully!"

        return result

    except Exception as e:

        return {
            "error": str(e),
            "success": False
        }

# ==========================================
# DATASET ANALYZE API
# ==========================================

@app.post("/analyze")
async def analyze_dataset(file: UploadFile = File(...)):
    return await dashboard_data(file)

    
# ==========================================
# DATA CLEANING API
# ==========================================

@app.post("/clean")
async def clean_dataset(file: UploadFile = File(...)):

    try:

        contents = await file.read()

        df = read_dataset(
            contents,
            file.filename
        )

        original_rows = len(df)

        # ----------------------------------
        # REMOVE DUPLICATE ROWS
        # ----------------------------------

        df = df.drop_duplicates().copy()

        # ----------------------------------
        # FILL NUMERICAL MISSING VALUES
        # USING MEDIAN
        # ----------------------------------

        for column in df.select_dtypes(
            include="number"
        ).columns:

            median_value = df[column].median()

            if pd.notna(median_value):

                df[column] = df[column].fillna(
                    median_value
                )

        # ----------------------------------
        # FILL CATEGORICAL MISSING VALUES
        # USING MODE
        # ----------------------------------

        for column in df.select_dtypes(
            include=["object", "category", "string"]
        ).columns:

            mode_value = df[column].mode()

            if not mode_value.empty:

                df[column] = df[column].fillna(
                    mode_value[0]
                )

        # ----------------------------------
        # GENERATE CLEANED CSV
        # ----------------------------------

        output = io.StringIO()

        df.to_csv(
            output,
            index=False
        )

        output.seek(0)

        cleaned_rows = len(df)

        return StreamingResponse(

            iter([output.getvalue()]),

            media_type="text/csv",

            headers={

                "Content-Disposition":
                "attachment; filename=cleaned_data.csv",

                "X-Original-Rows": str(original_rows),
                "X-Cleaned-Rows": str(cleaned_rows)
            }
        )

    except Exception as e:

        return {
            "error": str(e),
            "success": False
        }


# ==========================================
# DATASET CONTEXT GENERATOR
# ==========================================

def generate_dataset_context(df):

    context = []

    # ----------------------------------
    # BASIC DATASET INFORMATION
    # ----------------------------------

    context.append(
        f"Total Rows: {len(df)}"
    )

    context.append(
        f"Total Columns: {len(df.columns)}"
    )

    context.append(
        f"Column Names: {list(df.columns)}"
    )

    # ----------------------------------
    # DATA TYPES
    # ----------------------------------

    context.append(
        "Column Data Types:\n"
        + df.dtypes.to_string()
    )

    # ----------------------------------
    # MISSING VALUES
    # ----------------------------------

    context.append(
        "Missing Values:\n"
        + df.isnull().sum().to_string()
    )

    # ----------------------------------
    # DUPLICATE ROWS
    # ----------------------------------

    context.append(
        f"Duplicate Rows: {int(df.duplicated().sum())}"
    )

    # ----------------------------------
    # NUMERICAL STATISTICS
    # ----------------------------------

    numeric_columns = df.select_dtypes(
        include="number"
    )

    if not numeric_columns.empty:

        context.append(
            "Numerical Statistics:\n"
            + numeric_columns.describe().round(2).to_string()
        )

    # ----------------------------------
    # CATEGORICAL ANALYSIS
    # ----------------------------------

    categorical_columns = df.select_dtypes(
        include=["object", "category", "bool"]
    )

    for column in categorical_columns.columns[:10]:

        context.append(
            f"Top values in {column}:\n"
            + df[column].value_counts().head(5).to_string()
        )

    # ----------------------------------
    # SAMPLE DATA
    # ----------------------------------

    context.append(
        "Sample Dataset (first 8 rows):\n"
        + df.head(8).to_string(index=False)
    )

    # ----------------------------------
    # AUTOMATIC GROUPBY ANALYSIS
    # ----------------------------------

    context.append("GROUPED DATA ANALYSIS:")

    numeric_columns = df.select_dtypes(
        include="number"
    )

    group_columns = [

        column for column in df.columns

        if df[column].nunique(dropna=True) <= 20
        and df[column].nunique(dropna=True) > 1

    ]

    for group_column in group_columns[:8]:

        available_numeric_columns = [

            column for column in numeric_columns.columns

            if column != group_column

        ]

        if available_numeric_columns:

            grouped_data = df.groupby(
                group_column,
                dropna=False
            )[available_numeric_columns[:8]].mean().round(3)

            context.append(
                f"\nAverage values grouped by {group_column}:\n"
                + grouped_data.to_string()
            )

    return "\n\n".join(context)


# ==========================================
# GEMINI AI DATA ANALYSIS TOOLS
# 7 PYTHON FUNCTIONS
# ==========================================


# ------------------------------------------
# TOOL 1: DATASET OVERVIEW
# ------------------------------------------

def get_dataset_overview(df: pd.DataFrame) -> str:

    """Get total rows, columns, column names and data types."""

    return f"""
Total Rows: {len(df)}
Total Columns: {len(df.columns)}
Column Names: {df.columns.tolist()}
Data Types: {df.dtypes.to_string()}
"""


# ------------------------------------------
# TOOL 2: MISSING VALUES
# ------------------------------------------

def get_missing_values(df: pd.DataFrame) -> str:

    """Find missing values in every dataset column."""

    missing = df.isnull().sum()

    return missing.to_string()


# ------------------------------------------
# TOOL 3: DUPLICATE COUNT
# ------------------------------------------

def get_duplicate_count(df: pd.DataFrame) -> str:

    """Calculate the total number of duplicate rows."""

    return str(int(df.duplicated().sum()))


# ------------------------------------------
# TOOL 4: COLUMN STATISTICS
# ------------------------------------------

def get_column_statistics(
    df: pd.DataFrame,
    column_name: str
) -> str:

    """Calculate numerical statistics for a column."""

    if column_name not in df.columns:
        return "Column not found."

    if not pd.api.types.is_numeric_dtype(df[column_name]):
        return "This column is not numerical."

    series = df[column_name].dropna()

    if series.empty:
        return "No numerical values available in this column."

    return (
        f"Count: {series.count()}\n"
        f"Mean: {series.mean():.2f}\n"
        f"Median: {series.median():.2f}\n"
        f"Minimum: {series.min():.2f}\n"
        f"Maximum: {series.max():.2f}\n"
        f"Standard Deviation: {series.std():.2f}"
    )


# ------------------------------------------
# TOOL 5: CATEGORY COUNTS
# ------------------------------------------

def get_category_counts(
    df: pd.DataFrame,
    column_name: str
) -> str:

    """Calculate category-wise counts for a column."""

    if column_name not in df.columns:
        return "Column not found."

    return df[column_name].value_counts(
        dropna=False
    ).to_string()


# ------------------------------------------
# TOOL 6: CATEGORICAL STATISTICS
# ------------------------------------------

def get_categorical_statistics(
    df: pd.DataFrame,
    column_name: str
) -> str:

    """Calculate categorical count and percentage."""

    if column_name not in df.columns:
        return "Column not found."

    if pd.api.types.is_numeric_dtype(df[column_name]):
        return "This column is numerical, not categorical."

    series = df[column_name].dropna()

    if series.empty:
        return "No categorical values available in this column."

    counts = series.value_counts()

    percentages = series.value_counts(normalize=True) * 100

    result = (
        f"Total Count: {len(series)}\n"
        f"Unique Categories: {series.nunique()}\n"
        f"Most Frequent Category: {counts.index[0]}\n"
        f"Category Distribution:\n"
    )

    for category, count in counts.items():

        percentage = percentages[category]

        result += (
            f"{category}: {count} "
            f"({percentage:.2f}%)\n"
        )

    return result


# ------------------------------------------
# TOOL 7: CORRELATION
# ------------------------------------------

def get_correlation(
    df: pd.DataFrame,
    first_column: str,
    second_column: str
) -> str:

    """Calculate correlation between two numerical columns."""

    if first_column not in df.columns:
        return "First column not found."

    if second_column not in df.columns:
        return "Second column not found."

    if not pd.api.types.is_numeric_dtype(df[first_column]):
        return "First column is not numerical."

    if not pd.api.types.is_numeric_dtype(df[second_column]):
        return "Second column is not numerical."

    correlation = df[first_column].corr(
        df[second_column]
    )

    if pd.isna(correlation):
        return "Correlation cannot be calculated for these columns."

    return f"Correlation: {correlation:.4f}"


# ==========================================
# GEMINI AI DATA ASSISTANT + RAG
# ==========================================

@app.post("/chat")
async def chat_with_dataset(
    file: UploadFile = File(...),
    question: str = Form(...)
):

    try:

        # ----------------------------------
        # VALIDATE QUESTION
        # ----------------------------------

        if not question.strip():

            return {
                "error": "Please enter a question.",
                "success": False
            }

        # ----------------------------------
        # READ DATASET
        # ----------------------------------

        contents = await file.read()

        df = read_dataset(
            contents,
            file.filename
        )

        dataset_id = create_dataset_identifier(
            contents,
            file.filename
        )

        # ----------------------------------
        # SIMPLE GREETING HANDLING
        # ----------------------------------

        greetings = [
            "hi",
            "hello",
            "hey",
            "good morning",
            "good afternoon",
            "good evening"
        ]

        if question.strip().lower().rstrip("!.?") in greetings:

            return {
                "question": question,
                "answer": (
                    "Hello! 👋 How can I help you "
                    "analyze your dataset today?"
                ),
                "filename": file.filename,
                "success": True
            }

        # ----------------------------------
        # GEMINI API CHECK
        # ----------------------------------

        if gemini_client is None:

            return {
                "error": "Gemini API key is not configured.",
                "success": False
            }

        # ----------------------------------
        # GENERATE DATASET CONTEXT
        # ----------------------------------

        dataset_context = generate_dataset_context(df)

        # ----------------------------------
        # RAG SEMANTIC SEARCH
        # ----------------------------------

        rag_context = "No relevant RAG context found."

        try:

            retrieved_documents = search_dataset_embeddings(
                question=question,
                filename=file.filename,
                dataset_id=dataset_id,
                k=5
            )

            rag_context = format_retrieved_documents(
                retrieved_documents
            )

        except Exception as e:

            print("RAG Retrieval Error:", str(e))

            rag_context = "RAG context unavailable."

        # ==================================
        # GEMINI TOOL CALLING FUNCTIONS
        # ==================================

        # TOOL 1

        def tool_dataset_overview():

            """Get total rows, columns, names and data types."""

            return get_dataset_overview(df)

        # TOOL 2

        def tool_missing_values():

            """Find missing values in the uploaded dataset."""

            return get_missing_values(df)

        # TOOL 3

        def tool_duplicate_count():

            """Count duplicate rows in the uploaded dataset."""

            return get_duplicate_count(df)

        # TOOL 4

        def tool_column_statistics(column_name: str):

            """Calculate numerical statistics for a specified column."""

            return get_column_statistics(
                df,
                column_name
            )

        # TOOL 5

        def tool_category_counts(column_name: str):

            """Get category-wise counts for a specified column."""

            return get_category_counts(
                df,
                column_name
            )

        # TOOL 6

        def tool_categorical_statistics(column_name: str):

            """Calculate category-wise counts and percentages."""

            return get_categorical_statistics(
                df,
                column_name
            )

        # TOOL 7

        def tool_correlation(
            first_column: str,
            second_column: str
        ):

            """Calculate correlation between two numerical columns."""

            return get_correlation(
                df,
                first_column,
                second_column
            )

        # ==================================
        # PROFESSIONAL AI RESPONSE PROMPT
        # ==================================

        prompt = f"""
You are a Professional AI Data Analyst Assistant.

Your responsibility is to analyze uploaded datasets and answer questions using actual dataset information.

STRICT INSTRUCTIONS:

1. Answer ONLY the user's current question.
2. Always use actual information from the uploaded dataset.
3. Never invent or guess numerical values.
4. Never repeat answers from previous questions.
5. Explain answers in simple, understandable English.
6. Use short and meaningful sentences.
7. Do not provide unnecessary introductions.
8. Do not return unrelated dataset information.
9. If information is unavailable, clearly say so.
10. Never assume the meaning of unknown columns.
11. Do not treat sample rows as the complete dataset.
12. For numerical calculations, use the appropriate Python tools.
13. For category percentages, use the categorical statistics tool.
14. Do not calculate dataset statistics from sample rows.
15. Use the actual uploaded dataset for every calculation.

TOOL USAGE INSTRUCTIONS:

Available tools:

- tool_dataset_overview:
  Use for rows, columns and data types.

- tool_missing_values:
  Use for missing value questions.

- tool_duplicate_count:
  Use for duplicate row questions.

- tool_column_statistics:
  Use for mean, median, minimum, maximum and standard deviation.

- tool_category_counts:
  Use for category-wise counts.

- tool_categorical_statistics:
  Use for category count and percentage questions.

- tool_correlation:
  Use for correlation between numerical columns.

IMPORTANT:

Whenever a question requires one of these calculations, call the corresponding Python tool.

Do not guess the result from the dataset context.

For gender distribution and category percentage questions, always use tool_categorical_statistics.

STRICT RESPONSE FORMATTING:

Every heading MUST start on a NEW LINE.

Always leave one blank line after every heading.

Always leave one blank line between sections.

Use this structure whenever appropriate:

### Answer

Write a direct and simple answer here.

### Results

1. **Total Rows:** Actual dataset value.

2. **Total Columns:** Actual dataset value.

3. **Important Result:** Actual dataset value.

### Key Insight

Write one or two simple sentences explaining the most important finding.

FORMATTING RULES:

- Use Markdown headings properly.
- Use bold for important values and labels.
- Use numbered lists for multiple results.
- Use bullet points for additional insights.
- Keep each numbered result on a separate line.
- Keep paragraphs short and readable.
- Never combine headings with paragraphs.
- Never combine multiple numbered results.
- Do not generate broken sentences.
- Do not return raw Python code.

QUESTION-SPECIFIC RULES:

For comparison questions:
- Show each category.
- Display its actual value.
- Identify the highest and lowest values.

For percentage questions:
- Show the actual percentage.
- Explain what it represents.

For average questions:
- Show the calculated average.
- Explain the result briefly.

For survival rate questions:
- Use the mean of the Survived column.
- Convert the mean into a percentage.
- Do not assume survival information if the column is unavailable.

For dataset information questions:
- Use the actual uploaded filename.
- Use the actual total row count.
- Use the actual total column count.

If requested information is unavailable, clearly explain that it cannot be determined from the uploaded dataset.

UPLOADED FILE:
{file.filename}

DATASET INFORMATION:
{dataset_context}

RETRIEVED RAG CONTEXT:
{rag_context}

USER QUESTION:
{question}

Use the retrieved RAG context only as supporting information.
For exact counts, percentages, averages and other calculations, use the Python tools on the complete uploaded dataset.

Now answer the user's question accurately, professionally and in simple English.
"""

        # ==================================
        # GEMINI AUTOMATIC TOOL CALLING
        # ==================================

        response = gemini_client.models.generate_content(

            model=GEMINI_MODEL,

            contents=prompt,

            config=types.GenerateContentConfig(

                tools=[
                    tool_dataset_overview,
                    tool_missing_values,
                    tool_duplicate_count,
                    tool_column_statistics,
                    tool_category_counts,
                    tool_categorical_statistics,
                    tool_correlation
                ],

                automatic_function_calling=
                types.AutomaticFunctionCallingConfig(
                    maximum_remote_calls=10
                )
            )
        )

        # ----------------------------------
        # GET AI RESPONSE
        # ----------------------------------

        answer = response.text

        if not answer:

            answer = (
                "Sorry, I couldn't generate an answer. "
                "Please try again."
            )

        # ----------------------------------
        # FORMAT AI RESPONSE
        # ----------------------------------

        answer = format_ai_response(answer)

        # ----------------------------------
        # RETURN AI RESPONSE
        # ----------------------------------

        return {

            "question": question,
            "answer": answer,
            "filename": file.filename,
            "dataset_id": dataset_id,
            "ai_model": GEMINI_MODEL,
            "rag_used": rag_context != "RAG context unavailable.",
            "success": True
        }

    except Exception as e:

        return {

            "error": str(e),
            "success": False
        }
