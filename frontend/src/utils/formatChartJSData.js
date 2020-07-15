export const formatChartData = (reference, stats) => {
  let data = { datasets: [{ data: [], backgroundColor: [] }], labels: [] };

  data.datasets[0].data = reference.map((f) => stats[f.field]);
  const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
  data.datasets[0].data = data.datasets[0].data.map((v) => Math.round((v / total) * 100));
  data.datasets[0].backgroundColor = reference.map((f) => f.backgroundColor);
  data.datasets[0].borderColor = reference.map((f) => f.borderColor);
  data.labels = reference.map((f) => f.label);

  return data;
};

export const formatTimelineData = (stats, mappedColour, validatedColour) => {
  let mapped = {
    data: [],
    backgroundColor: mappedColour,
    borderColor: mappedColour,
    fill: false,
    label: 'Mapped tasks',
  };
  let validated = {
    data: [],
    backgroundColor: validatedColour,
    borderColor: validatedColour,
    fill: false,
    label: 'Validated tasks',
  };

  const labels = stats.map((entry) => entry.date);
  mapped.data = stats.map((entry) =>
    Math.round((entry.cumulative_mapped / entry.total_tasks) * 100),
  );
  validated.data = stats.map((entry) =>
    Math.round((entry.cumulative_validated / entry.total_tasks) * 100),
  );

  return { datasets: [validated, mapped], labels: labels };
};

export const formatTooltip = (tooltipItem, data) => {
  var label = data.labels[tooltipItem.index] || '';
  if (label) label += ': ';
  label += data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];

  return (label += '%');
};

export const formatTimelineTooltip = (tooltipItem, data) => {
  var label = data.datasets[tooltipItem.datasetIndex].label || '';
  if (label) label += ': ';
  label += data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];

  return (label += '%');
};
