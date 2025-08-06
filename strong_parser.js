export function parseStrongFormat(rows) {
  const volumeData = {}, maxWeight = {}, counts = {}, rawSets = {};

  rows.forEach(r => {
    const dt = r["Date"];
    const date = dt?.slice(0,10);
    const ex   = r["Exercise Name"]?.trim();
    const w    = parseFloat(r["Weight (kg)"]);
    const reps = parseInt(r["Reps"]);
    const id   = r["Workout #"];

    if (!date || !ex || isNaN(w) || isNaN(reps)) return;

    // total volume
    const vol = w * reps;
    (volumeData[ex] = volumeData[ex]||{})[date] = (volumeData[ex][date]||0) + vol;

    // max weight
    (maxWeight[ex] = maxWeight[ex]||{})[date] = Math.max(maxWeight[ex][date]||0, w);

    // count workouts
    (counts[ex] = counts[ex]||new Set()).add(id);

    // raw weights
    (rawSets[ex] = rawSets[ex]||[]).push(w);
  });

  Object.keys(counts).forEach(ex => counts[ex] = counts[ex].size);
  return { volumeData, maxWeight, counts, rawSets };
}
