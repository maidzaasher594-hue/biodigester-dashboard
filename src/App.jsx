import { useEffect, useState, useMemo } from "react";
import { supabase } from "./supabaseClient";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Paper,
  CssBaseline,
  createTheme,
  ThemeProvider,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Switch,
  Chip,
  Alert,
} from "@mui/material";

import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

import OpacityIcon from "@mui/icons-material/Opacity";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import SpeedIcon from "@mui/icons-material/Speed";
import CloudIcon from "@mui/icons-material/Cloud";

function App() {
  const [data, setData] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [pointLimit, setPointLimit] = useState(50);
  const [alert, setAlert] = useState(null);

  // ================= REALTIME =================
  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("live-sensors")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_readings" },
        (payload) => {
          setData((prev) => [...prev, payload.new]);
          checkAlerts(payload.new);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchData() {
    const { data } = await supabase
      .from("sensor_readings")
      .select("*")
      .order("created_at", { ascending: true });

    if (data) setData(data);
  }

  function checkAlerts(d) {
    if (!d) return;

    if (d.temperature > 60) setAlert("🔥 High Temperature");
    else if (d.gauge_pressure > 3) setAlert("⚠️ High Pressure");
    else if (d.predicted_gas > 80) setAlert("🚨 Gas Critical");
    else setAlert(null);
  }

  const latest = data[data.length - 1];
  const trimmed = pointLimit === "all" ? data : data.slice(-pointLimit);

  // ================= THEME =================
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          background: {
            default: darkMode ? "#0b1220" : "#f4f6f8",
            paper: darkMode ? "#111827" : "#ffffff",
          },
        },
        shape: { borderRadius: 16 },
      }),
    [darkMode]
  );

  // ================= CHART =================
  const chartData = {
    labels: trimmed.map((d) =>
      new Date(d.created_at).toLocaleTimeString()
    ),
    datasets: [
      {
        label: "pH",
        data: trimmed.map((d) => d.ph),
        borderColor: "#38bdf8",
      },
      {
        label: "Temp",
        data: trimmed.map((d) => d.temperature),
        borderColor: "#f97316",
      },
      {
        label: "Pressure",
        data: trimmed.map((d) => d.gauge_pressure),
        borderColor: "#22c55e",
      },
      {
        label: "Gas",
        data: trimmed.map((d) => d.predicted_gas),
        borderColor: "#a855f7",
      },
    ],
  };

  // ================= KPI CARD (FIXED STRETCH LAYOUT) =================
  const KPI = ({ title, value, unit, icon, color }) => (
    <Card
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 2,
        borderRadius: 3,
      }}
    >
      {/* ICON */}
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `${color}20`,
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      {/* VALUE */}
      <Box textAlign="right">
        <Typography sx={{ fontSize: 12, opacity: 0.7 }}>
          {title}
        </Typography>

        <Typography sx={{ fontSize: 22, fontWeight: 700 }}>
          {value?.toFixed(2) ?? "--"}{" "}
          <span style={{ fontSize: 12 }}>{unit}</span>
        </Typography>
      </Box>
    </Card>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* HEADER */}
      <AppBar position="static">
        <Toolbar>
          <Typography sx={{ fontWeight: 700 }}>
            🧪 Biodigester Control System
          </Typography>

          <Box sx={{ ml: "auto", display: "flex", gap: 2, alignItems: "center" }}>
            
            {/* DATA POINT DROPDOWN */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Points</InputLabel>
              <Select
                value={pointLimit}
                label="Points"
                onChange={(e) =>
                  setPointLimit(
                    e.target.value === "all"
                      ? "all"
                      : Number(e.target.value)
                  )
                }
              >
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
                <MenuItem value={200}>200</MenuItem>
                <MenuItem value="all">All</MenuItem>
              </Select>
            </FormControl>

            {/* THEME SWITCH */}
            <IconButton onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 3 }}>

        {/* ALERT */}
        {alert && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {alert}
          </Alert>
        )}

        {/* KPI GRID (FULL WIDTH FIXED) */}
        <Grid container spacing={2} sx={{ width: "100%" }}>
          <Grid item xs={12} md={3}>
            <KPI title="pH" value={latest?.ph} icon={<OpacityIcon />} color="#38bdf8" />
          </Grid>

          <Grid item xs={12} md={3}>
            <KPI title="Temp" value={latest?.temperature} unit="°C" icon={<ThermostatIcon />} color="#f97316" />
          </Grid>

          <Grid item xs={12} md={3}>
            <KPI title="Pressure" value={latest?.gauge_pressure} unit="bar" icon={<SpeedIcon />} color="#22c55e" />
          </Grid>

          <Grid item xs={12} md={3}>
            <KPI title="Gas" value={latest?.predicted_gas} unit="%" icon={<CloudIcon />} color="#a855f7" />
          </Grid>
        </Grid>

        {/* CHART */}
        <Paper
          sx={{
            mt: 3,
            p: 2,
            height: 360,
            width: "100%",
            borderRadius: 3,
          }}
        >
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;