import { createEffect, onMount, createSignal } from 'solid-js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function ResidualChart(props) {
  let canvasRef;
  let chartInstance;
  const [time, setTime] = createSignal(0);

  onMount(() => {
    function animate() {
      setTime(t => t + 0.016);
      requestAnimationFrame(animate);
    }
    animate();
  });

  createEffect(() => {
    if (!canvasRef || !props.history?.length) return;
    
    const ctx = canvasRef.getContext('2d');
    
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    const visibleCount = Math.min(props.currentIteration + 1, props.history.length);
    const visibleData = props.history.slice(0, visibleCount);
    
    const t = time();
    const waveIntensity = (Math.sin(t * 3) + 1) / 2;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 150);
    gradient.addColorStop(0, `rgba(239, 68, 68, ${0.5 + waveIntensity * 0.3})`);
    gradient.addColorStop(0.5, `rgba(245, 158, 11, ${0.4 + waveIntensity * 0.2})`);
    gradient.addColorStop(1, `rgba(16, 185, 129, ${0.3 + waveIntensity * 0.2})`);
    
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: visibleData.map(d => d.iteration),
        datasets: [
          {
            label: '残差 (L2范数)',
            data: visibleData.map(d => d.residual),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4
          },
          {
            label: '最大约束违反',
            data: visibleData.map(d => d.maxConstraintViolation),
            borderColor: '#ef4444',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 300,
          easing: 'easeOutQuart'
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#94a3b8',
              font: { size: 10 },
              boxWidth: 12,
              boxHeight: 12
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#e4e4e7',
            bodyColor: '#94a3b8',
            borderColor: '#475569',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toExponential(4)}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: '迭代次数',
              color: '#94a3b8',
              font: { size: 10 }
            },
            ticks: {
              color: '#64748b',
              font: { size: 9 },
              maxTicksLimit: 8
            },
            grid: {
              color: 'rgba(51, 65, 85, 0.3)'
            }
          },
          y: {
            type: 'logarithmic',
            title: {
              display: true,
              text: '残差值 (对数尺度)',
              color: '#94a3b8',
              font: { size: 10 }
            },
            ticks: {
              color: '#64748b',
              font: { size: 9 },
              callback: function(value) {
                if (value === 0) return '0';
                return value.toExponential(0);
              }
            },
            grid: {
              color: 'rgba(51, 65, 85, 0.3)'
            }
          }
        }
      }
    });
  });

  return (
    <canvas ref={canvasRef} class="residual-chart"></canvas>
  );
}
