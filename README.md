🤖 AI-Powered Data Analyst Agent

Transform Your Data into Intelligent Insights Using AI
An AI-powered data analytics platform that helps users upload datasets, explore data, generate visualizations, and ask questions using natural language.

The platform combines Python-based data processing, Generative AI, Retrieval-Augmented Generation (RAG), and interactive dashboards to simplify data analysis.

📌 Problem Statement:
Businesses and organizations work with large datasets every day.

However:

Non-technical users struggle to analyze complex datasets.
Finding meaningful insights requires SQL or programming knowledge.
Manual data cleaning takes significant time.
Creating visualizations and dashboards requires technical skills.
Understanding large datasets can be difficult and time-consuming.

Even simple questions like:

What is the average score?
Which state has the highest number of students?
What is the gender distribution?
Which category has the highest qualification rate?
can require considerable effort.

💡 Our Solution:
We developed an AI-Powered Data Analyst Agent that simplifies the data analysis process.

Users can upload datasets, explore analytical results, interact with AI, and generate meaningful insights through an interactive dashboard.

Key Capabilities
Upload datasets for analysis.
Perform automated data analysis.
Identify missing values and duplicate records.
Generate statistical summaries.
Create interactive charts and visualizations.
Ask questions using an AI-powered chatbot.
Retrieve relevant dataset information using RAG.
Generate contextual responses using AI.
🚀 Key Features
1. Dataset Upload
Upload CSV datasets.
Excel file support (.xlsx and .xls) through the backend.
Dataset information stored in PostgreSQL.
2. Automated Data Analysis
Total rows and columns.
Column names and data types.
Missing value detection.
Duplicate row detection.
Statistical analysis.
3. Data Cleaning
Remove duplicate records.
Handle missing numerical values.
Handle missing categorical values.
Download cleaned datasets separately.
4. Interactive Dashboard
Dynamic charts and visualizations.
State-wise analysis.
District-wise analysis.
Gender distribution.
Qualification analysis.
Subject-wise analysis.
Year-wise analysis.
5. AI-Powered Chatbot
Natural language interaction.
Dataset-related questions.
Context-aware responses.
AI-generated analytical insights.
6. Retrieval-Augmented Generation (RAG)
Dataset embeddings.
Vector database integration.
Semantic search.
Context retrieval.
AI-powered responses based on retrieved information.
7. Tool Calling
AI-powered tool execution.
Dataset analysis operations.
Contextual information retrieval.
Automated analytical workflows.
🛠️ Technology Stack
Frontend
React.js
JavaScript
CSS
Recharts
Backend
Python
FastAPI
REST APIs
Data Processing
Pandas
NumPy
Database
PostgreSQL
SQLAlchemy
pgvector
Artificial Intelligence
Google Gemini API
LangChain
LangChain Google GenAI
Sentence Transformers
RAG Architecture
Retrieval-Augmented Generation
Embeddings
Vector Search
Semantic Retrieval
Development Tools
Google Antigravity IDE
Visual Studio Code
Git
GitHub
pgAdmin
Deployment
Vercel – Frontend
Render – Backend
⚙️ System Workflow
             USER
               |
               v
        Upload Dataset
               |
               v
       FastAPI Backend
               |
               v
        Data Processing
          (Pandas)
               |
               v
       Automated Analysis
               |
          +----+----+
          |         |
          v         v
      PostgreSQL   Embeddings
          |         |
          |      pgvector
          |         |
          +----+----+
               |
               v
        AI Processing
       (Google Gemini)
               |
               v
       RAG + Tool Calling
               |
               v
       Analytical Results
               |
        +------+------+
        |      |      |
        v      v      v
      Insights Charts AI Chat
        |      |      |
        +------+------+
               |
               v
       Interactive Dashboard
📂 Project Structure
AI-Data-Analyst-Agent/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIChat.jsx
│   │   │   ├── DistrictChart.jsx
│   │   │   ├── DynamicCharts.jsx
│   │   │   ├── GenderChart.jsx
│   │   │   ├── QualificationChart.jsx
│   │   │   ├── StateChart.jsx
│   │   │   ├── SubjectChart.jsx
│   │   │   └── Yearchart.jsx
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
└── README.md
🔧 Installation and Setup
1. Clone the Repository
git clone YOUR_GITHUB_REPOSITORY_URL
2. Backend Setup
cd backend
Install dependencies:

pip install -r requirements.txt
Configure environment variables in .env:

DATABASE_URL=your_postgresql_database_url
GEMINI_API_KEY=your_gemini_api_key
Start FastAPI:

uvicorn main:app --reload
Backend API:

http://127.0.0.1:8000
API Documentation:

http://127.0.0.1:8000/docs
3. Frontend Setup
cd frontend
Install dependencies:

npm install
Start the frontend:

npm run dev
🌐 Deployment
Frontend: Vercel

Backend: Render

Database: PostgreSQL

🎯 Project Objectives
Simplify data analytics using Artificial Intelligence.
Reduce manual data cleaning efforts.
Enable natural language interaction with datasets.
Generate meaningful insights and visualizations.
Integrate RAG and vector databases into data analytics.
Build an end-to-end AI-powered analytics platform.
🔮 Future Enhancements
JSON dataset upload support.
PDF document upload and analysis.
Advanced natural language query processing.
More interactive visualization options.
Advanced predictive analytics.
Improved conversational memory.
Export analytical reports.
👨‍💻 Project Information
Project Name: AI-Powered Data Analyst Agent

Domain: Artificial Intelligence & Data Analytics

Frontend: React.js

Backend: Python FastAPI

AI Integration: Google Gemini

Database: PostgreSQL + pgvector

Development Environment: Google Antigravity IDE

⭐ Conclusion
The AI-Powered Data Analyst Agent aims to make data analytics more accessible by combining Artificial Intelligence, automated data processing, RAG, vector databases, and interactive visualizations.

It transforms traditional data analysis into an intelligent and interactive experience, helping users discover insights from their datasets with less manual effort.

