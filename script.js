document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("csvFileInput");
  const dropdown = document.getElementById("exerciseDropdown");
  const chartDiv = document.getElementById("chart");
  let exerciseData = {};

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        exerciseData = parseWorkoutData(rows);
        populateDropdown(Object.keys(exerciseData));
        dropdown.disabled = false;
        dropdown.dispatchEvent(new Event("change")); // trigger initial plot
      }
    });
  });

  dropdown.addEventListener("change", () => {
    const selectedExercise = dropdown.value;
    if (selectedExercise && exerciseData[selectedExercise]) {
      plotExercise(selectedExercise, exerciseData[selectedExercise]);
    }
  });

  function parseWorkoutData(rows) {
    const output = {};

    rows.forEach(row => {
      const date = row["Date"]?.slice(0, 10); // Just yyyy-mm-dd
      const exercise = row["Exercise Name"]?.trim();
      const weight = parseFloat(row["Weight (kg)"]);
      const reps = parseInt(row["Reps"]);

      if (!date || !exercise || isNaN(weight) || isNaN(reps)) return;

      const volume = weight * reps;

      if (!output[exercise]) output[exercise] = {};
      if (!output[exercise][date]) output[exercise][date] = 0;

      output[exercise][date] += volume;
    });

    return output;
  }

  function populateDropdown(exercises) {
    dropdown.innerHTML = "";
    exercises.sort().forEach(ex => {
      const option = document.createElement("option");
      option.value = ex;
      option.textContent = ex;
      dropdown.appendChild(option);
    });
  }

  function plotExercise(name, dateMap) {
    const dates = Object.keys(dateMap).sort();
    const volumes = dates.map(date => dateMap[date]);

    const trace = {
      x: dates,
      y: volumes,
      mode: "lines+markers",
      name: name,
    };

    const layout = {
      title: `${name} – Volume Over Time`,
      xaxis: { title: "Date" },
      yaxis: { title: "Volume (Reps × Weight)" }
    };

    Plotly.newPlot(chartDiv, [trace], layout);
  }
});
