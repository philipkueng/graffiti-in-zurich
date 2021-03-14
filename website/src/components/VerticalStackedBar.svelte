<script>
  import { fly } from "svelte/transition";
  export let data;
  export let activeYear;

  function getColor(loopYear, activeYear) {
    if (activeYear) {
      return loopYear === activeYear ? "#268bcc" : "darkgrey";
    }
    return "black";
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
    display: flex;
    flex-direction: column;
    align-items: center;
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

  .stacked-bar-year {
    color: black;
    font-family: "StreetWars";
    font-size: 50px;
  }
</style>

<div class="stacked-bar-container">
  {#each data as statistic}
    <div
      class="stacked-bar"
      style="color: {getColor(statistic.year, activeYear)};">
      <div style="display: flex; flex-direction: column;">
        <!-- {#if statistic.year === activeYear}
          <span
            class="stacked-bar-year"
            style="writing-mode: vertical-rl; text-orientation: mixed;">
            {statistic.totalReports}
          </span>
        {/if} -->
        {#each statistic.districts as district}
          {#each district.coordinates as coordinate}
            <span class="coordinate-block">
              {coordinate.lon}, {coordinate.lat}
            </span>
          {/each}
        {/each}
      </div>
      <span class="stacked-bar-year">{statistic.year}</span>
    </div>
  {/each}

</div>
