<script lang="ts">
  import { detectionResult } from './stores'

  interface LineData {
    rho: number
    theta: number
    votes: number
    isFalsePositive?: boolean
    falseReason?: string
  }

  let result: { lines: LineData[] } | null = null
  let selectedIndex: number | null = null

  detectionResult.subscribe((v) => {
    result = v
    selectedIndex = null
  })

  $: sortedLines = result?.lines
    ? [...result.lines].sort((a, b) => b.votes - a.votes)
    : []

  $: peakCount = result?.lines ? result.lines.length : 0

  function selectRow(idx: number) {
    selectedIndex = selectedIndex === idx ? null : idx
  }
</script>

<div class="data-panel">
  <h3 class="panel-title">检测数据</h3>
  <div class="peak-info">
    累加器峰值: <span class="peak-value">{peakCount}</span>
  </div>
  <div class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>ρ</th>
          <th>θ (°)</th>
          <th>票数</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        {#each sortedLines as line, i}
          <tr
            class:selected={selectedIndex === i}
            class:fp={line.isFalsePositive}
            on:click={() => selectRow(i)}
          >
            <td class="font-mono">{i + 1}</td>
            <td class="font-mono">{line.rho.toFixed(1)}</td>
            <td class="font-mono">{(line.theta * 180 / Math.PI).toFixed(1)}</td>
            <td class="font-mono">{line.votes}</td>
            <td>
              {#if line.isFalsePositive}
                <span class="fp-badge">误检</span>
              {:else}
                <span class="ok-badge">正常</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if sortedLines.length === 0}
      <div class="empty">暂无数据</div>
    {/if}
  </div>
</div>

<style>
  .data-panel {
    background: var(--bg-card);
    border: 1px solid rgba(0, 229, 255, 0.3);
    border-radius: 12px;
    padding: 18px;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
  }

  .data-panel:hover {
    border-color: var(--accent-cyan);
    box-shadow: var(--glow-cyan);
  }

  .panel-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--accent-cyan);
    margin-bottom: 10px;
    letter-spacing: 0.5px;
  }

  .peak-info {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 10px;
  }

  .peak-value {
    color: var(--accent-cyan);
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
  }

  .table-wrap {
    max-height: 260px;
    overflow-y: auto;
    border-radius: 6px;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  .data-table th {
    text-align: left;
    padding: 6px 8px;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
    font-weight: 500;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .data-table td {
    padding: 5px 8px;
    border-bottom: 1px solid rgba(30, 41, 59, 0.5);
    color: var(--text-primary);
  }

  .data-table tr {
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .data-table tr:hover {
    background: rgba(0, 229, 255, 0.05);
  }

  .data-table tr.selected {
    background: rgba(0, 229, 255, 0.12);
  }

  .data-table tr.fp td {
    color: var(--accent-red);
  }

  .fp-badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 10px;
    background: rgba(255, 61, 0, 0.2);
    color: var(--accent-red);
    border: 1px solid rgba(255, 61, 0, 0.3);
  }

  .ok-badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 10px;
    background: rgba(0, 229, 255, 0.1);
    color: var(--accent-cyan);
    border: 1px solid rgba(0, 229, 255, 0.2);
  }

  .empty {
    text-align: center;
    padding: 20px;
    color: var(--text-secondary);
    font-size: 13px;
  }
</style>
