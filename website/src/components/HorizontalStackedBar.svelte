<script>
  export let districts;
  export let totalReports;
  export let districtColors;

  function getWidth(districtTotalReports, totalReports) {
    console.log(`(100 * ${districtTotalReports}) / ${totalReports})`);
    console.log((100 * districtTotalReports) / totalReports);
    return (100 * districtTotalReports) / totalReports;
  }

  function getColor(districtName) {
    console.log(districtName);
    console.log(districtColors);

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
      style="height: 100%; width: {getWidth(district.totalReports, totalReports)}%;
      background-color: {getColor(district.name)}" />
  {/each}
</div>
