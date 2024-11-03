<template>
  <div class="line-graph-container">
    <h5>Points Earned Per Month</h5>
    <canvas ref="pointsChart"></canvas>
  </div>
</template>

<script>
import { onMounted, ref, watch } from "vue";
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default {
  props: {
    labels: {
      type: Array,
      required: true
    },
    data: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const pointsChart = ref(null);
    let chartInstance = null; // Track the Chart instance

    const createChart = () => {
      if (!pointsChart.value) return;

      if (chartInstance) {
        chartInstance.destroy();
      }

      const ctx = pointsChart.value.getContext("2d");
      chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: props.labels,
          datasets: [{
            label: "Points",
            data: props.data,
            borderColor: "#007bff",
            backgroundColor: "#9BD0F5",
            // "rgba(0, 123, 255, 0.1)",
            fill: true,
            tension: 0.3,
          }]
        },
        options: {
          responsive: true,            // Enable responsiveness
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: 20,    // Padding for top to avoid overlap with the title
              bottom: 20, // Padding for bottom to avoid overlap with the x-axis
              left: 20,   // Padding for left for y-axis labels
              right: 20   // Padding for right
            }
          }, // Allow the chart to stretch
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Points"
              }
            }
          },
          plugins: {
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
              callbacks: {
                label: (tooltipItem) => {
                  return `Points: ${tooltipItem.raw}`;
                }
              }
            }
          }
        }
      });
    };

    watch(() => [props.labels, props.data], () => {
      createChart(); // Recreate chart on labels or data change
    }, { immediate: true });

    onMounted(() => {
      createChart(); // Create the chart after the component is mounted
    });

    return { pointsChart };
  }
};
</script>

<style scoped>
.line-graph-container {
  width: 100%;
  /* Full width */
  height: 300px;
  /* Fixed height, adjust as needed */
  position: relative;
  /* Positioning context */
  margin: 0 auto;
  /* Center the container */
  overflow: hidden;
  /* Prevent overflow */
}

canvas {
  width: 100% !important;
  /* Full width for the canvas */
  height: 100% !important;
  /* Full height for the canvas */
}
</style>
