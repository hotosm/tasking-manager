export const formatChartData = (reference: any, stats: any) => {
  let data = { datasets: [{ data: [], backgroundColor: [] }], labels: [] };

  data.datasets[0].data = reference.map((f) => stats[f.field]);
  const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
  data.datasets[0].data = data.datasets[0].data.map((v) => Math.round((v / total) * 100));
  data.datasets[0].backgroundColor = reference.map((f) => f.backgroundColor);
  data.datasets[0].borderColor = reference.map((f) => f.borderColor);
  data.labels = reference.map((f) => f.label);

  return data;
};

export const formatTimelineData = (stats: any, mappedTasksConfig: any, validatedTasksConfig: any) => {
  let mapped = {
    data: [],
    backgroundColor: mappedTasksConfig.color,
    borderColor: mappedTasksConfig.color,
    fill: false,
    label: mappedTasksConfig.label,
  };
  let validated = {
    data: [],
    backgroundColor: validatedTasksConfig.color,
    borderColor: validatedTasksConfig.color,
    fill: false,
    label: validatedTasksConfig.label,
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

export const formatTasksStatsData = (stats: any, mappedTasksConfig: any, validatedTasksConfig: any) => {
  let mapped = {
    data: [],
    backgroundColor: mappedTasksConfig.color,
    label: mappedTasksConfig.label,
  };
  let validated = {
    data: [],
    backgroundColor: validatedTasksConfig.color,
    label: validatedTasksConfig.label,
  };

  const labels = stats.map((entry) => entry.date);
  mapped.data = stats.map((entry) => entry.mapped);
  validated.data = stats.map((entry) => entry.validated);

  return { datasets: [mapped, validated], labels: labels };
};

export const formatTooltip = (context: any) => {
  var label = context.label;
  if (label) label += ': ';
  label += context.dataset.data[context.dataIndex];

  return `${label}%`;
};

export const formatTimelineTooltip = (context: any, isPercent: boolean) => {
  var label = context.dataset.label || '';
  if (label) label += ': ';
  label += context.dataset.data[context.dataIndex];

  return `${label}${isPercent ? '%' : ''}`;
};
