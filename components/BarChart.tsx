import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface BarChartProps {
  data: { label: string; value: number }[];
  goal: number;
  width: number;
  height: number;
}

const AnimatedBar = React.memo(function AnimatedBar({
  x,
  barWidth,
  barHeight,
  chartHeight,
  index,
  isOver,
}: {
  x: number;
  barWidth: number;
  barHeight: number;
  chartHeight: number;
  index: number;
  isOver: boolean;
}) {
  const animatedHeight = useSharedValue(0);

  useEffect(() => {
    animatedHeight.value = 0;
    animatedHeight.value = withDelay(
      index * 30,
      withTiming(barHeight, { duration: 500 }),
    );
  }, [barHeight, index, animatedHeight]);

  const animatedProps = useAnimatedProps(() => ({
    y: chartHeight - animatedHeight.value,
    height: animatedHeight.value,
  }));

  return (
    <AnimatedRect
      x={x}
      width={barWidth}
      rx={3}
      ry={3}
      fill={isOver ? "#FF6B6B" : "#111111"}
      animatedProps={animatedProps}
    />
  );
});

const BarChart = React.memo(function BarChart({
  data,
  goal,
  width,
  height,
}: BarChartProps) {
  const paddingLeft = 36;
  const paddingRight = 8;
  const paddingBottom = 24;
  const paddingTop = 16;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingBottom - paddingTop;

  const maxValue = Math.max(...data.map((d) => d.value), goal, 1);

  // For month view (30 bars) keep bars narrower; for week (7 bars) keep them nice
  const barSlot = chartWidth / Math.max(data.length, 1);
  const barWidth = Math.max(barSlot * 0.55, 3);

  const topLabelY = paddingTop + 8;
  const goalY = paddingTop + chartHeight - (goal / maxValue) * chartHeight;
  const goalLabelY = goalY + 4;

  // Only show the goal label if it won't overlap with the top (max) label.
  // 16px minimum gap prevents the "2000 / 1999" double-label bug when goal ≈ max.
  const showGoalLabel = goalLabelY - topLabelY > 16;

  // Show the actual maxValue (not a rounded approximation) to avoid showing
  // two subtly different numbers at the top.
  const yLabels = [
    { label: `${maxValue}`, y: topLabelY },
    ...(showGoalLabel ? [{ label: `${goal}`, y: goalLabelY }] : []),
  ];

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {/* Subtle horizontal baseline */}
        <Line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={width - paddingRight}
          y2={paddingTop + chartHeight}
          stroke="#F0F0F0"
          strokeWidth={1}
        />

        {/* Goal dashed line */}
        <Line
          x1={paddingLeft}
          y1={goalY}
          x2={width - paddingRight}
          y2={goalY}
          stroke="#DDDDDD"
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {/* Y-axis labels */}
        {yLabels.map((yl, i) => (
          <SvgText
            key={i}
            x={2}
            y={yl.y}
            fill="#CCCCCC"
            fontSize={9}
            fontFamily="Questrial"
          >
            {yl.label}
          </SvgText>
        ))}

        {/* Bars + X labels */}
        {data.map((d, i) => {
          const barH = (d.value / maxValue) * chartHeight;
          const x = paddingLeft + i * barSlot + (barSlot - barWidth) / 2;
          const isOver = d.value > goal;

          // For month view skip every other label to avoid crowding
          const showLabel =
            data.length <= 10 ||
            i === 0 ||
            (i + 1) % Math.ceil(data.length / 10) === 0;

          return (
            <React.Fragment key={i}>
              {d.value > 0 && (
                <AnimatedBar
                  x={x}
                  barWidth={barWidth}
                  barHeight={barH}
                  chartHeight={paddingTop + chartHeight}
                  index={i}
                  isOver={isOver}
                />
              )}
              {showLabel && (
                <SvgText
                  x={x + barWidth / 2}
                  y={height - 5}
                  fill="#BBBBBB"
                  fontSize={8}
                  textAnchor="middle"
                  fontFamily="Questrial"
                >
                  {d.label}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
  },
});

export default BarChart;
