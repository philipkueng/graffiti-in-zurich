<script>
  export let data;
  export let activeYear;

  function getColor(loopYear, activeYear) {
    return loopYear === activeYear ? "orange" : "darkgrey";
  }
</script>

<style>
  .stacked-bar-container {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-around;
  }

  .stacked-bar {
    width: 33%;
  }

  .coordinate-block {
    font-size: 3px;
    font-weight: bold;
    display: block;
    height: 1.5px;
    letter-spacing: 2px;
    font-variant-numeric: tabular-nums;
  }
</style>

<div class="stacked-bar-container">
  {#each data as statistic}
    <div
      class="stacked-bar"
      style="color: {getColor(statistic.year, activeYear)};">
      {#each statistic.districts as district}
        {#each district.coordinates as coordinate}
          <span class="coordinate-block">
            {coordinate.lon}, {coordinate.lat}
          </span>
        {/each}
      {/each}
      <h3 style="color: black">{statistic.year}</h3>
    </div>
  {/each}
</div>
