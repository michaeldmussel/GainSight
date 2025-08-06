document.getElementById('csvFileInput').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    delimiter: ';',
    complete: function(results) {
      const data = results.data;
      plotExerciseTrend(data, "Deadlift (Barbell)");
    }
  });
});

function plotExerciseTrend(data, exerciseName) {
  const filtered = data.filter(row => row["Exercise Name"] === exerciseName);

  const dates = filtered.map(row => row["Date"]);
  const weights = filtered.map(row => parseFloat(row["Weight (kg)"]));
  const reps = filtered.map(row => parseInt(row["Reps"]));
  const volume = weights.map((w, i) => w * reps[i]);

  const trace = {
    x: dates,
    y: volume,
    type: 'scatter',
    mode: 'lines+markers',
    name: `${exerciseName} Volume`
  };

  Plotly.newPlot('chart', [trace], {
    title: `${exerciseName} Volume Over Time`,
    xaxis: { title: 'Date' },
    yaxis: { title: 'Volume (kg x reps)' }
  });
}