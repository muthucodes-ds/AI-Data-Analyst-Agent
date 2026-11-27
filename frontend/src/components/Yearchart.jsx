import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'

function YearChart({ data }) {

    const chartData = Object.entries(data || {}).map(
        ([year, value]) => ({
            year,
            averageMarks: value
        })
    )

    return (
        <div className="chart-container">
            <h3>Year-wise Performance</h3>

            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                    <Line
                        type="monotone"
                        dataKey="averageMarks"
                        stroke="#8884d8"
                        strokeWidth={3}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

export default YearChart