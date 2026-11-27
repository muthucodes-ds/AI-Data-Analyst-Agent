🤖 AI-Powered Data Analyst Agent
Transform Raw Data into Intelligent Insights with Generative AI
An intelligent data analytics platform that combines Python, React, FastAPI, PostgreSQL, and Google Gemini AI to automate data analysis, generate insights, and enable conversational interaction with datasets.

📌 Overview
AI-Powered Data Analyst Agent is an intelligent web application designed to simplify and automate the data analysis workflow.

The platform allows users to upload CSV datasets, perform automated exploratory data analysis (EDA), identify data quality issues, clean datasets, generate interactive visualizations, and interact with an AI-powered assistant.

By integrating Generative AI, Retrieval-Augmented Generation (RAG), and AI Tool Calling, the application provides an interactive approach to understanding and exploring data.

✨ Key Features
📂 1. Dataset Management
Upload CSV datasets.
Extract dataset information.
Display total rows and columns.
Store dataset metadata in PostgreSQL.
📊 2. Automated Data Analysis
Exploratory Data Analysis (EDA).
Missing value detection.
Duplicate record identification.
Numerical and categorical data analysis.
Statistical insights.
🧹 3. Intelligent Data Cleaning
Identify missing values.
Detect duplicate records.
Generate data cleaning suggestions.
Handle missing values using appropriate strategies.
Generate cleaned datasets for download.
📈 4. Interactive Analytics Dashboard
Dynamic data visualizations.
State-wise analysis.
District-wise analysis.
Gender distribution.
Qualification analysis.
Subject-wise performance analysis.
Year-wise analytics.
🤖 5. AI-Powered Chatbot
Ask natural language questions about uploaded datasets.
Generate context-aware responses.
Explore analytical information through conversations.
🧠 6. Retrieval-Augmented Generation (RAG)
Dataset-based information retrieval.
Retrieve relevant information for user queries.
Generate context-aware AI responses.
⚙️ 7. AI Tool Calling
Execute specialized data analysis operations.
Connect AI responses with backend analysis functions.
Support interactive analytical workflows.
🛠️ Technology Stack
Category	Technologies
Frontend	React.js, JavaScript, HTML5, CSS3
UI Development	Recharts, Vite
Backend	Python, FastAPI
Data Processing	Pandas, NumPy
Database	PostgreSQL, SQLAlchemy
Generative AI	Google Gemini API
AI Architecture	RAG, Prompt Engineering, Tool Calling
Vector Database	pgvector
API Development	REST APIs
Development Environment	Antigravity IDE
Version Control	Git, GitHub
🏗️ System Architecture
The application follows a full-stack architecture.

          USER
            |
            ▼
     REACT FRONTEND
            |
            ▼
       FASTAPI
        BACKEND
            |
     ┌──────┼──────────┐
     |      |          |
     ▼      ▼          ▼
  PANDAS  GEMINI    POSTGRESQL
  NUMPY    API       DATABASE
     |      |
     ▼      ▼
 DATA     RAG &
ANALYSIS  TOOL CALLING
     |      |
     └──┬───┘
        |
        ▼
  ANALYTICAL INSIGHTS
        |
        ▼
 INTERACTIVE DASHBOARD
📁 Project Structure
AI-Data-Analyst-Agent/
│
├── backend/
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── rag.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
⚙️ Installation & Setup
Prerequisites
Python
Node.js and npm
PostgreSQL
Google Gemini API Key
Git
1. Clone Repository
git clone https://github.com/muthucodes-ds/AI-Data-Analyst-Agent.git
cd AI-Data-Analyst-Agent
2. Backend Configuration
cd backend
Create a virtual environment:

python -m venv venv
Activate the environment on Windows:

venv\Scripts\activate
Install dependencies:

pip install -r requirements.txt
Configure the required database connection and Gemini API credentials in your backend .env file.

3. Run Backend
uvicorn main:app --reload
Backend:

http://127.0.0.1:8000

API Documentation:

http://127.0.0.1:8000/docs

4. Frontend Configuration
Open a new terminal:

cd frontend
Install dependencies:

npm install
Start the frontend:

npm run dev
Open the local development URL displayed in your terminal.

🎯 Project Objectives
Automate repetitive data analysis tasks.
Simplify data cleaning and preprocessing.
Generate meaningful insights from raw datasets.
Integrate Generative AI into traditional data analytics.
Enable natural language interaction with datasets.
Build an intelligent and interactive analytics platform.
🔮 Future Enhancements
Support for Excel and additional file formats.
Advanced predictive analytics.
Machine Learning model integration.
Automated report generation.
Advanced data visualization.
Multi-dataset analysis.
👨‍💻 Developer
MUTHUESWARAPANDIAN K

B.Tech – Artificial Intelligence and Data Science

P.S.R. Rengasamy College of Engineering

GitHub: @muthucodes-ds

Project Repository:

AI-Powered Data Analyst Agent

Built with Python, React, FastAPI and Generative AI.
Turning Data into Intelligence. 🚀 

