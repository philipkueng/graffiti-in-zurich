<script>
  import { fly } from "svelte/transition";
  export let data;
  export let activeYear;
  export let districtColors;

  let statisticByActiveYear = data.find(entry => entry.year === activeYear);
  let districts = statisticByActiveYear.districts;
  let totalReportsYear = statisticByActiveYear.totalReports;

  function getWidth(districtTotalReports, totalReports) {
    return (100 * districtTotalReports) / totalReports;
  }

  function getColor(districtName) {
    return districtColors.find(district => district.name === districtName)
      .color;
  }
</script>

<style>
  .stacked-bar {
    height: 10%;
    display: flex;
    flex-direction: row;
    padding: 0 20px;
  }
</style>

<div class="stacked-bar">
  {#each districts as district}
    <div
      style="height: 100%; width: {getWidth(district.totalReports, totalReportsYear)}%;
      background-color: {getColor(district.name)}" />
  {/each}
</div>
