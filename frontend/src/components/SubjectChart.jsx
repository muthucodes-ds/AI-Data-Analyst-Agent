import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'

function SubjectChart({ data }) {

    const chartData = Object.entries(data || {}).map(
        ([name, value]) => ({
            subject: name,
            average: value
        })
    )

    return (
        <div className="chart-container">
            <h3>Subject Average Marks</h3>

            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />

                    <Bar dataKey="average" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export default SubjectChart
