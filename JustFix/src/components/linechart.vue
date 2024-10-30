<template>
    <div class="line-graph-container">
      <h5>Points Earned Per Month</h5>
      <canvas ref="pointsChart"></canvas>
    </div>
  </template>
  
  <script>
  import { onMounted, ref } from "vue";

  
  export default {
    props: {
      labels: Array,
      data: Array
    },
    setup(props) {
      const pointsChart = ref(null);

      console.log(labels);
      console.log(data);
      onMounted(() => {
        new Chart(pointsChart.value.getContext("2d"), {
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
            maintainAspectRatio: true,
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
  