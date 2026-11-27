import { useState } from 'react'
import './App.css'


import GenderChart from './components/GenderChart'
import QualificationChart from './components/QualificationChart'
import StateChart from './components/StateChart'
import SubjectChart from './components/SubjectChart'
import Yearchart from './components/Yearchart'
import DistrictChart from './components/DistrictChart'
import DynamicCharts from './components/DynamicCharts'

const API = "http://127.0.0.1:8000"

function App() {

  const [file, setFile] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const [analysisResult, setAnalysisResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  const [visualizationResult, setVisualizationResult] = useState(null)
  const [visualizing, setVisualizing] = useState(false)

  const [cleaning, setCleaning] = useState(false)
  const [cleaningMessage, setCleaningMessage] = useState("")

  const [cleaningSuggestions, setCleaningSuggestions] = useState(null)
  const [suggesting, setSuggesting] = useState(false)

  const [messages, setMessages] = useState([])
  const [userQuestion, setUserQuestion] = useState("")
  const [chatLoading, setChatLoading] = useState(false)


  // UPLOAD DATASET

  const handleUpload = async () => {

    if (!file) {
      alert("Please select a CSV file")
      return
    }

    setLoading(true)
    setUploadResult(null)
    setAnalysisResult(null)
    setVisualizationResult(null)
    setCleaningMessage("")
    setCleaningSuggestions(null)
    setMessages([])

    const formData = new FormData()
    formData.append("file", file)

    try {

      const response = await fetch(`${API}/dashboard`, {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || "Upload failed")
      }

      setUploadResult(data)
      alert("File uploaded successfully!")

    } catch (error) {

      alert("Upload error: " + error.message)

    } finally {

      setLoading(false)

    }
  }


  // DATA ANALYSIS

  const handleAnalyze = async () => {

    if (!file || !uploadResult) {
      alert("Please upload a dataset first!")
      return
    }

    setAnalyzing(true)

    const formData = new FormData()
    formData.append("file", file)

    try {

      const response = await fetch(`${API}/analyze`, {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      console.log("UPLOAD DATA:", data)

      if (!response.ok || data.error) {
        throw new Error(data.error || "Analysis failed")
      }

      setAnalysisResult(data)
      alert("Dataset Analysis Completed!")

    } catch (error) {

      alert("Analysis error: " + error.message)

    } finally {

      setAnalyzing(false)

    }
  }


  // DATA VISUALIZATION

  const handleVisualize = async () => {

    if (!file || !uploadResult) {
      alert("Please upload a dataset first!")
      return
    }

    setVisualizing(true)
    setVisualizationResult(null)

    const formData = new FormData()
    formData.append("file", file)

    try {

      const response = await fetch(`${API}/dashboard`, {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || "Visualization failed")
      }

      setVisualizationResult(data)
      alert("Data Visualization Completed!")

    } catch (error) {

      alert("Visualization error: " + error.message)

    } finally {

      setVisualizing(false)

    }
  }


  // DATA CLEANING

  const handleClean = async () => {

    if (!file || !uploadResult) {
      alert("Please upload a dataset first!")
      return
    }

    setCleaning(true)
    setCleaningMessage("")

    const formData = new FormData()
    formData.append("file", file)

    try {

      const response = await fetch(`${API}/clean`, {
        method: "POST",
        body: formData
      })

      if (!response.ok) {

        const errorData = await response.json()
        throw new Error(errorData.error || "Data cleaning failed")

      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = "cleaned_data.csv"

      document.body.appendChild(link)
      link.click()
      link.remove()

      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)

      setCleaningMessage(
        "Dataset cleaned successfully! Cleaned CSV downloaded."
      )

    } catch (error) {

      alert("Cleaning error: " + error.message)

    } finally {

      setCleaning(false)

    }
  }


  // CLEANING SUGGESTIONS

  const handleCleaningSuggestions = async () => {

    if (!file || !uploadResult) {
      alert("Please upload a dataset first!")
      return
    }

    setSuggesting(true)
    setCleaningSuggestions(null)

    const formData = new FormData()
    formData.append("file", file)

    try {

      const response = await fetch(`${API}/analyze`, {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to analyze dataset")
      }

      const suggestions = []

      const missingValues = data.missing_values || {}

      Object.entries(missingValues).forEach(([column, count]) => {

        if (count > 0) {

          suggestions.push({
            issue: "Missing Values",
            column: column,
            count: count,
            recommendation: "Fill missing values using mean, median or mode."
          })

        }

      })

      if (data.duplicate_rows > 0) {

        suggestions.push({
          issue: "Duplicate Rows",
          count: data.duplicate_rows,
          recommendation: "Remove duplicate rows from the dataset."
        })

      }

      if (suggestions.length === 0) {

        suggestions.push({
          message: "Great! No missing values or duplicate rows found."
        })

      }

      setCleaningSuggestions({
        filename: data.filename,
        total_suggestions: suggestions.length,
        cleaning_suggestions: suggestions
      })

    } catch (error) {

      alert("Suggestions error: " + error.message)

    } finally {

      setSuggesting(false)

    }
  }


  // AI DATA ASSISTANT CHAT

  const handleSendMessage = async () => {

    if (!userQuestion.trim()) {
      return
    }

    if (!file || !uploadResult) {
      alert("Please upload a dataset first!")
      return
    }

    const question = userQuestion.trim()

    setMessages(prev => [
      ...prev,
      {
        sender: "user",
        text: question
      }
    ])

    setUserQuestion("")
    setChatLoading(true)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("question", question)

    try {

      const response = await fetch(`${API}/chat`, {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || "Chat request failed")
      }

      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: data.answer
        }
      ])

    } catch (error) {

      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, something went wrong: " + error.message
        }
      ])

    } finally {

      setChatLoading(false)

    }
  }


  return (

    <div className="app-container">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <h2>🤖 Data Analyst AI</h2>

        <nav>

          <a href="#dashboard">🏠 Dashboard</a>

          <a href="#upload">📁 Upload Your Dataset</a>

          <a href="#analysis">📊 Data Analytics</a>

          <a href="#suggestions">🧹 Cleaning Suggestions</a>

          <a href="#cleaning">📥 Clean Dataset & Download</a>

          <a href="#visualization">📈 Data Visualization Dashboard</a>

          <a href="#chatbot">🤖 AI Data Assistant</a>

        </nav>

        <div className="sidebar-bottom">

          <p>AI-Powered Analytics</p>
          <small>Version 1.0</small>

        </div>

      </aside>


      {/* MAIN CONTENT */}

      <main className="main-content">

        <header className="topbar">

          <h2>Dashboard</h2>
          <span>AI Data Analyst Agent</span>

        </header>


        {/* 1. DASHBOARD */}

        <section id="dashboard" className="welcome">

          <h1>Welcome to AI Data Analyst Agent 🚀</h1>

          <p>
            Upload your dataset and let AI analyze,
            clean and generate insights from your data.
          </p>

        </section>


        {/* 2. UPLOAD DATASET */}

        <section id="upload" className="upload-section">

          <h2>📁 Upload Your Dataset</h2>

          <p>
            Upload your CSV file to start analyzing your data.
          </p>

          <div className="upload-box">

            <h1>📂</h1>

            <h3>Choose Your CSV File</h3>

            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {

                setFile(e.target.files[0])
                setUploadResult(null)
                setAnalysisResult(null)
                setVisualizationResult(null)
                setCleaningMessage("")
                setCleaningSuggestions(null)
                setMessages([])

              }}
            />

            {file && (
              <p>Selected File: {file.name}</p>
            )}

            <button
              onClick={handleUpload}
              disabled={loading}
              className="upload-btn"
            >

              {loading ? "Uploading..." : "Upload Dataset"}

            </button>

            {uploadResult && (

              <div className="upload-result">

                <h3>Upload Successful! ✅</h3>

                <p>File:
                  {uploadResult.filename}</p>

                <p>Total Rows:
                  {uploadResult.total_rows}</p>

                <p>Total Columns:
                  {uploadResult.total_columns}</p>

              </div>

            )}

          </div>

        </section>


        {/* 3. DATA ANALYTICS */}

        <section id="analysis" className="upload-section">

          <h2>📊 Data Analytics</h2>

          <p>
            Automatically analyze your uploaded dataset
            and generate useful insights.
          </p>

          <button
            onClick={handleAnalyze}
            disabled={!uploadResult || analyzing}
            className="upload-btn"
          >

            {analyzing ? "Analyzing Dataset..." : "🔍 Analyze Dataset"}

          </button>

          {analysisResult && (

            <div className="upload-result">

              <h2>📈 Analysis Results</h2>

              <p>Filename: {analysisResult.filename}</p>

              <p>Total Rows: {analysisResult.total_rows}</p>

              <p>Total Columns: {analysisResult.total_columns}</p>

              <h3>Column Names</h3>

              <ul>
                {analysisResult.column_names?.map((column, index) => (
                  <li key={index}>{column}</li>
                ))}
              </ul>

              <h3>Missing Values</h3>

              <pre>
                {JSON.stringify(analysisResult.missing_values, null, 2)}
              </pre>

              <h3>Duplicate Rows</h3>

              <p>{analysisResult.duplicate_rows}</p>

              <h3>✅ Analysis Completed Successfully!</h3>

            </div>

          )}

        </section>


        {/* 4. CLEANING SUGGESTIONS */}

        <section id="suggestions" className="upload-section">

          <h2>🧹 Cleaning Suggestions</h2>

          <p>
            Identify missing values, duplicate rows
            and get data cleaning recommendations.
          </p>

          <button
            onClick={handleCleaningSuggestions}
            disabled={!uploadResult || suggesting}
            className="upload-btn"
          >

            {suggesting ? "Checking Dataset..." : "🔍 Get Cleaning Suggestions"}

          </button>

          {cleaningSuggestions && (

            <div className="upload-result">

              <h3>📋 Data Quality Report</h3>

              <p>Filename: {cleaningSuggestions.filename}</p>

              <p>Total Suggestions: {cleaningSuggestions.total_suggestions}</p>

              {cleaningSuggestions.cleaning_suggestions?.map((item, index) => (

                <div
                  key={index}
                  style={{
                    border: "1px solid #ddd",
                    padding: "15px",
                    marginTop: "12px",
                    borderRadius: "8px"
                  }}
                >

                  {item.message ? (

                    <h4>✅ {item.message}</h4>

                  ) : (

                    <>

                      <h4>⚠️ {item.issue}</h4>

                      {item.column && (
                        <p>Column: {item.column}</p>
                      )}

                      <p>Count: {item.count}</p>

                      <p>Recommendation: {item.recommendation}</p>

                    </>

                  )}

                </div>

              ))}

              <h3 style={{ color: "green", marginTop: "20px" }}>
                ✅ Data Quality Check Completed!
              </h3>

            </div>

          )}

        </section>


        {/* 5. CLEAN DATASET & DOWNLOAD */}

        <section id="cleaning" className="upload-section">

          <h2>📥 Clean Dataset & Download</h2>

          <p>
            Remove duplicate rows and handle missing values
            automatically.
          </p>

          <button
            onClick={handleClean}
            disabled={!uploadResult || cleaning}
            className="upload-btn"
          >

            {cleaning ? "Cleaning Dataset..." : "🧹 Clean Dataset & Download"}

          </button>

          {cleaningMessage && (

            <p style={{ color: "green", marginTop: "15px" }}>
              ✅ {cleaningMessage}
            </p>

          )}

        </section>


        {/* 6. DATA VISUALIZATION DASHBOARD */}

        <section id="visualization" className="upload-section">

          <h2>📈 Data Visualization Dashboard</h2>

          <p>
            Generate interactive charts and visualize
            your dataset insights.
          </p>

          <button
            onClick={handleVisualize}
            disabled={!uploadResult || visualizing}
            className="upload-btn"
          >

            {visualizing ? "Generating Charts..." : "📊 Generate Visualizations"}

          </button>

          {visualizationResult && (

            <div className="visualization-dashboard">

              <h2>📊 Interactive Analytics Dashboard</h2>

              <DynamicCharts data={visualizationResult} />

              <div className="charts-grid">

                {visualizationResult.gender_distribution && (
                  <GenderChart data={visualizationResult.gender_distribution} />
                )}

                {visualizationResult.qualification_distribution && (
                  <QualificationChart data={visualizationResult.qualification_distribution} />
                )}

                {visualizationResult.state_distribution && (
                  <StateChart data={visualizationResult.state_distribution} />
                )}

                {visualizationResult.subject_average && (
                  <SubjectChart data={visualizationResult.subject_average} />
                )}

                {visualizationResult.yearly_performance && (
                  <YearChart data={visualizationResult.yearly_performance} />
                )}

                {visualizationResult.top_districts && (
                  <DistrictChart data={visualizationResult.top_districts} />
                )}

              </div>

              <h3>✅ Visualization Completed Successfully!</h3>

            </div>

          )}

        </section>


        {/* 7. AI DATA ASSISTANT */}

        <section id="chatbot" className="upload-section">

          <h2>🤖 AI Data Assistant</h2>

          <p>
            Ask questions about your uploaded dataset.
          </p>

          <div className="chat-container">

            <div className="chat-header">

              <h3>💬 Dataset Chatbot</h3>

              <span>● Online</span>

            </div>

            <div className="chat-messages">

              {messages.length === 0 && (

                <div className="bot-message">

                  <p>👋 Hello! I am your AI Data Assistant.</p>

                  <p>Upload a dataset and ask me questions!</p>

                </div>

              )}

              {messages.map((message, index) => (

                <div
                  key={index}
                  className={
                    message.sender === "user"
                      ? "user-message"
                      : "bot-message"
                  }
                >

                  <p>{message.text}</p>

                </div>

              ))}

              {chatLoading && (

                <div className="bot-message">
                  <p>Thinking... 🤖</p>
                </div>

              )}

            </div>

            <div className="chat-input">

              <input
                type="text"
                placeholder="Ask something about your dataset..."
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !chatLoading) {
                    handleSendMessage()
                  }
                }}
                disabled={chatLoading}
              />

              <button
                className="upload-btn"
                onClick={handleSendMessage}
                disabled={chatLoading || !uploadResult}
              >

                {chatLoading ? "Sending..." : "➤ Send"}

              </button>

            </div>

          </div>

        </section>

      </main>

    </div>

  )

}

export default App
