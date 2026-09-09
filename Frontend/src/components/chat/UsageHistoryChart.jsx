import React from "react";
import { Box, Typography } from "@mui/material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

const UsageHistoryChart = ({ history }) => {
  if (!history?.length) return null;

  return (
    <Box sx={{ mt: 4, height: 250 }}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Token Usage History
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="sequence" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <RechartsTooltip />
          <Area
            type="monotone"
            dataKey="inputTokens"
            name="Input Tokens"
            stackId="1"
            stroke="#9c27b0"
            fill="#9c27b0"
            fillOpacity={0.4}
          />
          <Area
            type="monotone"
            dataKey="outputTokens"
            name="Output Tokens"
            stackId="1"
            stroke="#1976d2"
            fill="#1976d2"
            fillOpacity={0.4}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default UsageHistoryChart;
