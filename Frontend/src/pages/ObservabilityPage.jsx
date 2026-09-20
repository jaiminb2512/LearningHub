import React, { useEffect, useState } from "react";
import {
  Alert, Box, Card, CardContent, CircularProgress, Grid, Paper,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography, Chip
} from "@mui/material";
import observabilityService from "../services/observabilityService";

const formatMs = (value) => value == null ? "-" : value < 1000 ? `${value} ms` : `${(value / 1000).toFixed(2)} s`;
const formatNumber = (value) => new Intl.NumberFormat().format(value || 0);

const MetricCard = ({ title, value, subtitle }) => (
  <Card>
    <CardContent>
      <Typography color="text.secondary" variant="body2">{title}</Typography>
      <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>{value}</Typography>
      {subtitle && <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>{subtitle}</Typography>}
    </CardContent>
  </Card>
);

export default function ObservabilityPage() {
  const [overview, setOverview] = useState(null);
  const [traces, setTraces] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      observabilityService.getObservabilityOverview(7),
      observabilityService.getObservabilityTraces({ limit: 50 }),
    ]).then(([summary, rows]) => {
      if (!active) return;
      setOverview(summary);
      setTraces(rows || []);
    }).catch((err) => {
      if (active) setError(err.response?.data?.message || err.message || "Failed to load observability");
    });
    return () => { active = false; };
  }, []);

  if (!overview && !error) {
    return <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>AI Observability</Typography>
        <Typography color="text.secondary">
          Database-backed tracing for LearningHub agents, tools and model calls.
        </Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {overview && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}><MetricCard title="Requests" value={formatNumber(overview.requests)} subtitle={`${overview.periodDays}-day window`} /></Grid>
          <Grid item xs={12} sm={6} md={3}><MetricCard title="Success Rate" value={`${overview.successRate}%`} subtitle={`${overview.successful} successful`} /></Grid>
          <Grid item xs={12} sm={6} md={3}><MetricCard title="Avg Latency" value={formatMs(overview.avgLatencyMs)} subtitle={`${overview.failed} failed`} /></Grid>
          <Grid item xs={12} sm={6} md={3}><MetricCard title="Total Tokens" value={formatNumber(overview.totalTokens)} subtitle={`${formatNumber(overview.inputTokens)} in / ${formatNumber(overview.outputTokens)} out`} /></Grid>
        </Grid>
      )}

      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={700}>Recent Traces</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Started</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Latency</TableCell>
                <TableCell>Tokens</TableCell>
                <TableCell>Trace ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {traces.map((trace) => (
                <TableRow key={trace.traceId} hover>
                  <TableCell>{new Date(trace.startedAt).toLocaleString()}</TableCell>
                  <TableCell>{trace.model || "-"}</TableCell>
                  <TableCell>
                    <Chip size="small" label={trace.status} color={trace.status === "SUCCESS" ? "success" : trace.status === "ERROR" ? "error" : "default"} />
                  </TableCell>
                  <TableCell>{formatMs(trace.latencyMs)}</TableCell>
                  <TableCell>{formatNumber(trace.totalTokens)}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{trace.traceId}</TableCell>
                </TableRow>
              ))}
              {!traces.length && <TableRow><TableCell colSpan={6} align="center">No traces yet. Send an AI chat message first.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
