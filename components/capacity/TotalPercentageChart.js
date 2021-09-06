import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const barColors = ["#7fb069", "#333bbd", "#e6aa68", "#ca3c25", "#1d1a05", "#7fb069", "#333bbd", "#e6aa68", "#ca3c25", "#1d1a05", "#7fb069", "#333bbd", "#e6aa68", "#ca3c25", "#1d1a05", "#7fb069", "#333bbd", "#e6aa68", "#ca3c25", "#1d1a05"]
const lineColors = ["#247ba0", "#70c1b3", "#b2dbbf", "#E3B52d", "#ff1654", "#247ba0", "#70c1b3", "#b2dbbf", "#E3B52d", "#ff1654", "#247ba0", "#70c1b3", "#b2dbbf", "#E3B52d", "#ff1654", "#247ba0", "#70c1b3", "#b2dbbf", "#E3B52d", "#ff1654"]

const TotalPercentageChart = ({ data, lines, bars, percentages }) => {

  return (
    <>
      <ResponsiveContainer width={"100%"} height={500}>
        <ComposedChart
          data={data}
          margin={{
            top: 20,
            right: -10,
            left: -10,
            bottom: 60,
          }}

        >
          <Legend verticalAlign="top" wrapperStyle={{ top: "0" }} height={20} layout="horizontal" />
          <CartesianGrid strokeDasharray="1 1" />
          <XAxis dataKey="firstDate"
            allowDataOverflow={false}
            interval={1} // display all of values, instead of the default 5
            angle={-60} // force text to be 90, reading towards the graph
            dx={-6}
            textAnchor="end" // rather than setting "dy={50}" or something 
          />

          <YAxis yAxisId="left" orientation="left" type="number" interval="preserveStartEnd" />
          <YAxis yAxisId="right" orientation="right" type="number" interval="preserveStartEnd" />


          < Tooltip />


          {bars && bars.map((total, index) =>
            <Bar key={`bar -${index}`} dataKey={total} yAxisId="left" strokeWidth={1} fill={barColors[index + 4]} stroke={barColors[index + 4]} />
          )}
          {percentages && percentages.map((percentage, index) =>
            <Bar key={`percent -${index}`} dataKey={percentage} style={{ opacity: "0.7" }} yAxisId="right" strokeWidth={1} fill={lineColors[index + 4]} stroke={lineColors[index + 4]} />
          )}

          {lines && lines.map((total, index) =>
            <Line key={`lines-${index}`} dataKey={total} type="monotone" yAxisId="left" stroke={barColors[index + 1]} fill={barColors[index + 1]} />
          )}

        </ComposedChart>


      </ResponsiveContainer>
    </>

  )
}

export default TotalPercentageChart
