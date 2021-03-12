<script>
  export let data;

  const districtColors = [
    { name: "Kreis 1", color: "yellow" },
    { name: "Kreis 2", color: "red" },
    { name: "Kreis 3", color: "blue" },
    { name: "Kreis 4", color: "black" },
    { name: "Kreis 5", color: "lightgrey" },
    { name: "Kreis 6", color: "lightblue" },
    { name: "Kreis 7", color: "brown" },
    { name: "Kreis 8", color: "orange" },
    { name: "Kreis 9", color: "green" },
    { name: "Kreis 10", color: "olive" },
    { name: "Kreis 11", color: "lightgreen" },
    { name: "Kreis 12", color: "grey" }
  ];

  let totalReports = 0;
  data.map(year => (totalReports += year.totalReports));

  function getWidth(districtTotalReports, totalReports) {
    return (100 * districtTotalReports) / totalReports;
  }

  function getColor(districtName) {
    return districtColors.find(district => district.name === districtName)
      .color;
  }
</script>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }

  .statistics-year {
    width: 33%;
  }

  .stacked-bar {
  }

  .stacked-bar-districts {
    height: 10%;
    display: flex;
    flex-direction: row;
    padding: 0 20px;
  }
</style>

<main>
  <div style="height: 100vh">
    <h1 style="margin-top: 180px; margin-bottom: 20px;">Graffiti in Zürich</h1>
    <h1 style="margin-top: 12px;">2018 - 2020</h1>
    <h3>von Philip Küng, sfgb:b IAD11</h3>
  </div>
  <div style="display: flex; flex-direction: row; height: 100vh;">
    {#each data as statistic}
      <div class="statistics-year">
        <div class="stacked-bar">
          {#each statistic.districts as district}
            {#each district.coordinates as coordinate}
              <span
                style="font-size: 3px; font-weight: bold; display: block;
                height: 1.5px; color: darkgrey;">
                {coordinate.lon}, {coordinate.lat}
              </span>
            {/each}
          {/each}
        </div>
        <h3>{statistic.year}</h3>
      </div>
    {/each}
  </div>
  <div
    style="height: 100vh; border-top: 1px solid black; display: flex;
    flex-direction: column; justify-content: center;">
    <h1>{data[0].year}</h1>
    <div class="stacked-bar-districts">
      {#each data[0].districts as district}
        <div
          style="height: 100%; width: {getWidth(district.totalReports, data[0].totalReports)}%;
          background-color: {getColor(district.name)}" />
      {/each}
    </div>
  </div>
  <div style="display: flex; flex-direction: row; height: 100vh;">
    {#each data as statistic}
      <div class="statistics-year">
        <div class="stacked-bar">
          {#each statistic.districts as district}
            {#each district.coordinates as coordinate}
              <span
                style="font-size: 3px; font-weight: bold; display: block;
                height: 1.5px; color: orange;">
                {coordinate.lon}, {coordinate.lat}
              </span>
            {/each}
          {/each}
        </div>
        <h3>{statistic.year}</h3>
      </div>
    {/each}
  </div>
  <div
    style="height: 100vh; border-top: 1px solid black; display: flex;
    flex-direction: column; justify-content: center;">
    <h1>{data[1].year}</h1>
    <div class="stacked-bar-districts">
      {#each data[1].districts as district}
        <div
          style="height: 100%; width: {getWidth(district.totalReports, data[0].totalReports)}%;
          background-color: {getColor(district.name)}" />
      {/each}
    </div>
  </div>
  <div style="display: flex; flex-direction: row; height: 100vh;">
    {#each data as statistic}
      <div class="statistics-year">
        <div class="stacked-bar">
          {#each statistic.districts as district}
            {#each district.coordinates as coordinate}
              <span
                style="font-size: 3px; font-weight: bold; display: block;
                height: 1.5px; color: orange;">
                {coordinate.lon}, {coordinate.lat}
              </span>
            {/each}
          {/each}
        </div>
        <h3>{statistic.year}</h3>
      </div>
    {/each}
  </div>
  <div
    style="height: 100vh; border-top: 1px solid black; display: flex;
    flex-direction: column; justify-content: center;">
    <h1>{data[2].year}</h1>
    <div class="stacked-bar-districts">
      {#each data[2].districts as district}
        <div
          style="height: 100%; width: {getWidth(district.totalReports, data[0].totalReports)}%;
          background-color: {getColor(district.name)}" />
      {/each}
    </div>
  </div>
</main>
