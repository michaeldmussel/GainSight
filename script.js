import { parseStrongFormat } from './strong_parser.js';
import { parseFormat2     } from './format2_parser.js';

document.addEventListener("DOMContentLoaded", () => {
  const fileInput      = document.getElementById("csvFileInput");
  const dropdown       = document.getElementById("exerciseDropdown");
  const formatSelector = document.getElementById("csvFormat");
  const chartVolDiv    = document.getElementById("chartVolume");
  const chartMaxDiv    = document.getElementById("chartMaxWeight");
  const toggleVol      = document.getElementById("toggleAvgVolume");
  const toggleMax      = document.getElementById("toggleAvgMaxWeight");

  let volumeData    = {}, maxWeightData = {}, counts = {}, rawSets = {};

  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      let text = evt.target.result;
      let format = formatSelector.value;
      let headerRegex;
      if (format === "strong") {
        headerRegex = /^Date,Exercise Name,Weight \(kg\),Reps,Workout #/m;
      } else {
        headerRegex = /^row_id,USERID,TIMESTAMP,belongSys/superset,_id,exercise_id,belongplan,exercisename,setcount,timer,logs,bodypart,mysort,targetrep,setdone,setdonetime,interval_time,interval_unit,rest_time_enabled,interval_time_enabled/m;
      }
      // Find the correct header line
      let match = text.match(headerRegex);
      if (match) {
        let idx = text.indexOf(match[0]);
        text = text.slice(idx);
      }
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        comments: "#",
        complete: ({ data: rows }) => {
          console.log("┌── Parsed rows:", rows.length);
          // Filter valid rows for each format:
          let valid;
          if (formatSelector.value === "strong") {
            valid = rows.filter(r => r["Date"] && r["Exercise Name"]);
            console.log("│ Strong valid rows:", valid.length);
            ({ volumeData, maxWeight: maxWeightData, counts, rawSets } =
              parseStrongFormat(valid));
          } else {
            valid = rows.filter(r => r["TIMESTAMP"] && r["logs"] && r["exercisename"]);
            console.log("│ Format2 valid rows:", valid.length);
            ({ volumeData, maxWeight: maxWeightData, counts, rawSets } =
              parseFormat2(valid));
          }

          // If nothing valid, warn:
          if (!Object.keys(counts).length) {
            console.warn("⚠️ No exercises detected for", formatSelector.value);
          }

          populateDropdown();
        },
        error: err => {
          console.error("PapaParse error:", err);
        }
      });
    };
    reader.readAsText(file);
  });

  dropdown.addEventListener("change", updateCharts);
  toggleVol .addEventListener("change", updateCharts);
  toggleMax .addEventListener("change", updateCharts);

  function populateDropdown() {
    dropdown.innerHTML = "";
    Object.entries(counts)
      .sort((a,b) => b[1] - a[1])
      .forEach(([ex]) => {
        const opt = new Option(ex, ex);
        const zeros = (rawSets[ex]||[]).filter(w => w === 0).length;
        if (zeros / (rawSets[ex]||[]).length > 0.5) {
          opt.classList.add("calisthenics");
        }
        dropdown.add(opt);
      });
    dropdown.disabled = false;
    dropdown.selectedIndex = 0;
    updateCharts();
  }

  function updateCharts() {
    const ex = dropdown.value;
    if (!ex) return;
    drawVolume(ex);
    drawMaxWeight(ex);
  }

  function drawVolume(ex) {
    const map   = volumeData[ex] || {};
    const dates = Object.keys(map).sort();
    const vals  = dates.map(d => map[d]);
    const msgEl = document.getElementById('chartVolumeMsg');
    if (dates.length === 0 || vals.every(v => v === 0)) {
      msgEl.textContent = 'No volume data available for this exercise.';
      msgEl.style.display = '';
      Plotly.purge(chartVolDiv);
      return;
    } else {
      msgEl.style.display = 'none';
    }
    const traces = [{ x: dates, y: vals, mode:'lines+markers', name:ex }];

    if (toggleVol.checked) {
      const { x: mx, y: my } = computeMonthlyAvg(map);
      traces.push({ x:mx, y:my, mode:'lines', name:'Monthly Avg Vol', line:{dash:'dot',color:'gray'} });
    }

    Plotly.newPlot(chartVolDiv, traces, {
      title: `${ex} – Volume Over Time`,
      xaxis: { title: 'Date' },
      yaxis: { title: 'Volume (Reps × Weight)' }
    });
  }

  function drawMaxWeight(ex) {
    const map   = maxWeightData[ex] || {};
    const dates = Object.keys(map).sort();
    const vals  = dates.map(d => map[d]);
    const msgEl = document.getElementById('chartMaxWeightMsg');
    if (dates.length === 0 || vals.every(v => v === 0)) {
      msgEl.textContent = 'No max weight data available for this exercise.';
      msgEl.style.display = '';
      Plotly.purge(chartMaxDiv);
      return;
    } else {
      msgEl.style.display = 'none';
    }
    const traces = [{ x: dates, y: vals, mode:'lines+markers', name:ex }];

    if (toggleMax.checked) {
      const { x: mx, y: my } = computeMonthlyAvg(map);
      traces.push({ x:mx, y:my, mode:'lines', name:'Monthly Avg Wt', line:{dash:'dot',color:'gray'} });
    }

    Plotly.newPlot(chartMaxDiv, traces, {
      title: `${ex} – Max Weight Per Day`,
      xaxis: { title: 'Date' },
      yaxis: { title: 'Max Weight (kg)' }
    });
  }

  function computeMonthlyAvg(map) {
    const months = {};
    for (let [date, v] of Object.entries(map)) {
      const m = date.slice(0,7);
      (months[m] = months[m]||[]).push(v);
    }
    const x = [], y = [];
    Object.keys(months).sort().forEach(m => {
      const arr = months[m];
      const avg = arr.reduce((a,b)=>a+b,0)/arr.length;
      arr.forEach(_ => { x.push(m + '-01'); y.push(avg); });
    });
    return { x, y };
  }
});
