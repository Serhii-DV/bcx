<script lang="ts">
import { storageCategoryColor } from '../storageColors';
import type { StorageChartPoint } from '../storageHistoryChart';
import { formatStorageBytes } from '../storageUsage';

let {
  title,
  points,
  labels,
  stacked = false,
  counts = false,
}: {
  title: string;
  points: StorageChartPoint[];
  labels: string[];
  stacked?: boolean;
  counts?: boolean;
} = $props();

const maximum = $derived(
  Math.max(
    1,
    ...points.map(
      (point) => point.values?.reduce((sum, value) => sum + value, 0) ?? 0,
    ),
  ),
);
const step = $derived(540 / points.length);
const x = (index: number) => 80 + (index + 0.5) * step;
const y = (value: number) => 160 - (value / maximum) * 130;
const format = (value: number) =>
  counts ? value.toLocaleString() : formatStorageBytes(value);
const path = $derived(
  points
    .map((point, index) =>
      point.values === null
        ? ''
        : `${index === 0 || points[index - 1].values === null ? 'M' : 'L'}${x(index)},${y(point.values[0] ?? 0)}`,
    )
    .join(' '),
);

function description(point: StorageChartPoint): string {
  return `${point.day}: ${point.values === null ? 'No measurement available' : point.values.map((value, index) => `${labels[index]}: ${format(value)}`).join(', ')}${point.measuredAt ? ` · Measured ${new Date(point.measuredAt).toLocaleString()}` : ''}`;
}
</script>

<figure>
  <figcaption>{title}</figcaption>
  <svg viewBox="0 0 640 195" role="img" aria-label={`${title}. Daily measurements; gaps mean no measurement. Exact values are in the measurement table below.`}>
    <line x1="80" y1="30" x2="620" y2="30" stroke="#4b5563" stroke-dasharray="3 4" />
    <line x1="80" y1="160" x2="620" y2="160" stroke="#4b5563" />
    <text x="72" y="34" text-anchor="end">{format(maximum)}</text>
    <text x="72" y="164" text-anchor="end">0</text>
    <text x="80" y="185">{points[0]?.day}</text>
    <text x="620" y="185" text-anchor="end">{points.at(-1)?.day}</text>
    {#if !stacked}<path d={path} fill="none" stroke="#38bdf8" stroke-width="2" />{/if}
    {#each points as point, index (point.day)}
      {#if point.values !== null}
        <g>
          <title>{description(point)}</title>
          {#if stacked}
            {#each point.values as value, category}
              {@const sum = point.values.slice(0, category + 1).reduce((total, item) => total + item, 0)}
              <rect x={x(index) - step * 0.4} y={y(sum)} width={step * 0.8} height={value / maximum * 130} fill={storageCategoryColor(labels[category])} />
            {/each}
          {:else}
            <circle cx={x(index)} cy={y(point.values[0] ?? 0)} r="2.5" fill="#38bdf8" />
          {/if}
          <rect x={x(index) - step / 2} y="25" width={step} height="140" fill="transparent" />
        </g>
      {/if}
    {/each}
  </svg>
  {#if stacked}
    <ul aria-label="Category legend">
      {#each labels as label}<li><span style:background={storageCategoryColor(label)}></span>{label}</li>{/each}
    </ul>
  {/if}
  <details>
    <summary>Measurement table</summary>
    <div class="table-scroll">
      <table>
        <caption class="sr-only">{title}: exact daily measurements</caption>
        <thead><tr><th scope="col">Day</th>{#each labels as label}<th scope="col">{label}</th>{/each}<th scope="col">Measured at</th></tr></thead>
        <tbody>
          {#each points.filter((point) => point.values !== null) as point (point.day)}
            <tr><th scope="row">{point.day}</th>{#each point.values ?? [] as value}<td>{format(value)}</td>{/each}<td>{point.measuredAt ? new Date(point.measuredAt).toLocaleString() : ''}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </details>
</figure>

<style>
  figure { margin: 16px 0; border-top: 1px solid #4b5563; padding-top: 12px; }
  figcaption { font-weight: 700; color: #f3f4f6; }
  svg { width: 100%; height: auto; display: block; }
  text { fill: #9ca3af; font-size: 12px; }
  ul { display: flex; flex-wrap: wrap; gap: 6px 12px; padding: 0; list-style: none; font-size: 0.75rem; }
  li { display: flex; align-items: center; gap: 4px; }
  li span { width: 10px; height: 10px; border-radius: 2px; }
  summary { cursor: pointer; color: #9ca3af; }
  summary:focus-visible { outline: 2px solid #38bdf8; }
  .table-scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
  th, td { padding: 6px; text-align: right; white-space: nowrap; }
  th:first-child { text-align: left; }
  tbody tr { border-top: 1px solid #4b5563; }
</style>
