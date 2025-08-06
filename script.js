document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("csvFileInput");
  const dropdown = document.getElementById("exerciseDropdown");
  const formatSelector = document.getElementById("csvFormat");
  const chartDiv = document.getElementById("chart");

  let exerciseData = {};
  let exerciseCounts = {};
  let calisthenicsDetected = new Set();

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const format = formatSelector.value;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;

        if (format === "strong") {
          const parsed = parseStrongFormat(rows);
          exerciseData = parsed.data;
          exerciseCounts = parsed.counts;
          calisthenicsDetected = detectCalisthenics(parsed.rawSets);
        }

        populateDropdown(exerciseCounts, calisthenicsDetected);
        dropdown.disabled = false;
        dropdown.dispatchEvent(new Event("change")); // auto-select first
      }
    });
  });

  dropdown.addEventListener("change", () => {
    const selectedExercise = dropdown.value;
    if (selectedExercise && exerciseData[selectedExercise]) {
      plotExercise(selectedExercise, exerciseData[selectedExercise]);
    }
  });

  function parseStrongFormat(rows) {
    const data = {};
    const counts = {};
    const rawSets = {}; // for calisthenics detection

    rows.forEach(row => {
      const dateTime = row["Date"];
      const date = dateTime?.slice(0, 10);
      const exercise = row["Exercise Name"]?.trim();
      const weight = parseFloat(row["Weight (kg)"]);
      const reps = parseInt(row["Reps"]);
      const workoutId = row["Workout #"];

      if (!date || !exercise || isNaN(weight) || isNaN(reps)) return;

      const volume = weight * reps;

      if (!data[exercise]) data[exercise] = {};
      if (!data[exercise][date]) data[exercise][date] = 0;
      data[exercise][date] += volume;

      if (!counts[exercise]) counts[exercise] = new Set();
      counts[exercise].add(workoutId);

      if (!rawSets[exercise]) rawSets[exercise] = [];
      rawSets[exercise].push(weight);
    });

    // Convert workout counts from Set to int
    Object.keys(counts).forEach(ex => {
      counts[ex] = counts[ex].size;
    });

    return { data, counts, rawSets };
  }

  function detectCalisthenics(rawSets) {
    const detected = new Set();

    for (const [exercise, weights] of Object.entries(rawSets)) {
      const zeroWeightCount = weights.filter(w => w === 0).length;
      const ratio = zeroWeightCount / weights.length;

      if (ratio > 0.5) {
        detected.add(exercise);
      }
    }

    return detected;
  }

  function populateDropdown(counts, calisthenicsSet) {
    dropdown.innerHTML = "";

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);

    sorted.forEach(([exercise, freq]) => {
      const isCalisthenic = calisthenicsSet.has(exercise);
      const option = document.createElement("option");
      option.value = exercise;
      option.textContent = exercise;
      if (isCalisthenic) option.classList.add("calisthenics");
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
