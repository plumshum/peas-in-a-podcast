import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { DimensionActivation } from './types'
import './DimensionRadarChart.css'

interface SingleRadarChartProps {
  dimensions: DimensionActivation[]
  title: string
  color: string
}

function SingleRadarChart({ dimensions, title, color }: SingleRadarChartProps): JSX.Element {
  if (!dimensions || dimensions.length === 0) {
    return <div className="no-dimensions-single">No {title.toLowerCase()} activations</div>
  }

  // Find the max value for normalization
  const maxValue = Math.max(...dimensions.map(d => Math.abs(d.value)))
  
  // Prepare data for radar chart using absolute values
  const chartData = dimensions.map(d => ({
    dimension: d.label || `Dim ${d.dimension}`,
    value: maxValue > 0 ? Math.abs(d.value) / maxValue : 0,
    rawValue: d.value,
    fullLabel: d.label,
  }))

  return (
    <div className="single-radar-container">
      <h5 className="radar-subtitle">{title}</h5>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <PolarGrid stroke="#ddd" />
          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fontSize: 9 }} />
          <Radar
            name={title}
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.5}
            isAnimationActive={false}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="dimension-legend-single">
        {chartData.map((d, idx) => (
          <div key={idx} className="dimension-item-single">
            <span className="dimension-label-single" title={d.fullLabel}>
              {d.fullLabel || `Dimension ${d.dimension}`}
            </span>
            <span className={`dimension-value-single`} style={{ color }}>
              {Math.abs(d.rawValue).toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface DimensionRadarChartProps {
  dimensions: {
    positive: DimensionActivation[]
    negative: DimensionActivation[]
  }
}

function DimensionRadarChart({ dimensions }: DimensionRadarChartProps): JSX.Element {
  if (!dimensions) {
    return <div className="no-dimensions">Dimension data unavailable</div>
  }

  const hasPositive = dimensions.positive && dimensions.positive.length > 0
  const hasNegative = dimensions.negative && dimensions.negative.length > 0

  if (!hasPositive && !hasNegative) {
    return <div className="no-dimensions">No dimension activations available</div>
  }

  return (
    <div className="dimension-radar-container">
      <h4 className="radar-title">SVD Components (Related Topics)</h4>
      <div className="radar-charts-grid">
        {hasPositive && (
          <SingleRadarChart 
            dimensions={dimensions.positive} 
            title="Top Positive Activations" 
            color="#4caf50"
          />
        )}
        {hasNegative && (
          <SingleRadarChart 
            dimensions={dimensions.negative} 
            title="Top Negative Activations" 
            color="#ff6b6b"
          />
        )}
      </div>
    </div>
  )
}

export default DimensionRadarChart
