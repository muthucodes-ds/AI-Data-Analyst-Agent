import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'

function DistrictChart({ data }) {

    const chartData = Object.entries(data || {}).map(
        ([name, value]) => ({
            district: name,
            students: value
        })
    )

    return (
        <div className="chart-container">
            <h3>Top 10 Districts</h3>

            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="district" />
                    <YAxis />
                    <Tooltip />

                    <Bar dataKey="students" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export default DistrictChart