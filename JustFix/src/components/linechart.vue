<template>
  <div class="line-graph-container">
    <h5>Points Earned Per Month</h5>
    <canvas ref="pointsChart"></canvas>
  </div>
</template>

<script>
import { onMounted, ref } from "vue";
// import { Chart, registerables } from 'chart.js';

// Chart.register(...registerables);

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

    onMounted(() => {
      const ctx = pointsChart.value.getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: {
          labels: props.labels,
          datasets: [{
            label: "Points",
            data: props.data,
            borderColor: "#007bff",
            backgroundColor: "rgba(0, 123, 255, 0.1)",
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // Set to false for better responsiveness
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Points"
              }
            }
          }
        }
      });
    });

    return { pointsChart };
  }
};
</script>

<style scoped>
.line-graph-container {
  width: 100%;
  height: 400px; /* Set a height for the chart container */
}
canvas {
  width: 100% !important; /* Ensure canvas uses full width */
  height: 100% !important; /* Ensure canvas uses full height */
}
</style>
