import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area
} from 'recharts'

function DynamicCharts({ data }) {

    if (!data) return null

    const categoricalData = data.categorical_charts || {}
    const numericalData = data.numerical_charts || {}

    return (
        <div className="charts-grid">

            {/* DATASET SUMMARY */}

            <div className="feature-card">
                <h3>Total Rows</h3>
                <h1>{data.total_rows}</h1>
            </div>

            <div className="feature-card">
                <h3>Total Columns</h3>
                <h1>{data.total_columns}</h1>
            </div>

            {/* CATEGORICAL CHARTS */}

            {Object.entries(categoricalData).map(([column, values]) => {

                const chartData = Object.entries(values.data || {}).map(
                    ([name, value]) => ({
                        name,
                        value
                    })
                )

                return (
                    <div className="feature-card" key={column}>

                        <h3>{column} Distribution</h3>

                        <ResponsiveContainer width="100%" height={300}>
                            {values.chart_type === "pie" ? (

                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={index}
                                                fill={["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][index % 5]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>

                            ) : (

                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-30}
                                        textAnchor="end"
                                        interval={0}
                                        hight={80} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value"
                                        fill="#10b981" radius={[6, 6, 0, 6]} />
                                </BarChart>

                            )}
                        </ResponsiveContainer>

                    </div>
                )
            })}

            {/* NUMERICAL CHARTS */}

            {Object.entries(numericalData).map(([column, stats]) => {

                const histogramData = Object.entries(
                    stats.histogram || {}
                ).map(([range, count]) => ({
                    range,
                    count
                }))

                return (
                    <div className="feature-card" key={column}>

                        <h3>{column} Distribution</h3>

                        <p>Mean: {stats.mean?.toFixed(2)}</p>
                        <p>Median: {stats.median?.toFixed(2)}</p>
                        <p>Minimum: {stats.min}</p>
                        <p>Maximum: {stats.max}</p>

                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={histogramData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="range" />
                                <YAxis />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#10b981"
                                    fill="#10b981"
                                />
                            </AreaChart>
                        </ResponsiveContainer>

                    </div>
                )
            })}

        </div>
    )
}

export default DynamicCharts