import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    const { data, error } = await supabase
      .from("sensor_readings")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error) setData(data);
  }

  const chartData = {
    labels: data.map(d => new Date(d.created_at).toLocaleTimeString()),
    datasets: [
      {
        label: "pH",
        data: data.map(d => d.ph),
      },
      {
        label: "Temperature",
        data: data.map(d => d.temperature),
      },
      {
        label: "Pressure",
        data: data.map(d => d.pressure),
      },
    ],
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Biodigester Dashboard</h1>
      <Line data={chartData} />

      {data.length > 0 && (
        <div>
          <h2>Latest Readings</h2>
          <p>pH: {data[data.length - 1].ph}</p>
          <p>Temp: {data[data.length - 1].temperature}</p>
          <p>Pressure: {data[data.length - 1].pressure}</p>
        </div>
      )}
    </div>
  );
}

export default App;