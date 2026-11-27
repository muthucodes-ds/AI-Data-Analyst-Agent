import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'

function StateChart({ data }) {

    const chartData = Object.entries(data || {}).map(
        ([name, value]) => ({
            name,
            students: value
        })
    )

    return (
        <div className="chart-container">
            <h3>Top 10 States</h3>

            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />

                    <Bar dataKey="students" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export default StateChart