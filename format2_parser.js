export function parseFormat2(rows) {
  const volumeData = {}, maxWeight = {}, counts = {}, rawSets = {};

  rows.forEach(r => {
    const ts  = r["TIMESTAMP"];
    const date = ts?.slice(0,10);
    const ex   = r["exercisename"]?.trim();
    const logs = r["logs"];
    if (!date || !ex || !logs) return;

    // Accept all sets like "70x5,80x5,0x0,0x1200"
    const sets = logs.split(',')
      .map(s=>s.trim())
      .filter(s=> /^\d+(\.\d+)?x\d+$/.test(s));

    if (!sets.length) return;

    sets.forEach(s => {
      const [wStr, rStr] = s.toLowerCase().split('x');
      const w = parseFloat(wStr), rep = parseInt(rStr);
      // Accept zero values for calisthenics/cardio
      if (isNaN(w) || isNaN(rep)) return;
      const vol = w * rep;

      (volumeData[ex] = volumeData[ex]||{})[date] = (volumeData[ex][date]||0) + vol;
      (maxWeight[ex]   = maxWeight[ex]  ||{})[date] = Math.max(maxWeight[ex][date]||0, w);
      (rawSets[ex]     = rawSets[ex]    ||[]).push(w);
    });

    (counts[ex] = counts[ex]||new Set()).add(ts);
  });

  Object.keys(counts).forEach(ex => counts[ex] = counts[ex].size);
  // Debug log to help user see what is parsed
  console.log({ volumeData, maxWeight, counts, rawSets });
  return { volumeData, maxWeight, counts, rawSets };
}
