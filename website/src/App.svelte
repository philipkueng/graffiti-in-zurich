<script>
  export let statisticsByYear;
  export let statisticsByDistrict;

  let totalReports = 0;
  statisticsByYear.map(year => (totalReports += year.totalReports));
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
</style>

<main>
  <div style="height: 100vh">
    <h1 style="margin-top: 180px; margin-bottom: 20px;">Graffiti in Zurich</h1>
    <h1 style="margin-top: 12px;">2018 - 2020</h1>
    <h3>by Philip Küng, sfgb:b IAD11</h3>
  </div>
  <div style="height: 100vh; border-top: 1px solid black;">
    <div class="animation" style="position: relative; margin-top: 300px">
      {#each Array(totalReports) as _, row}i{/each}
    </div>
    <div>
      during the years 2018, 2019 and 2020 there have been a total of
      <span style="font-weight: bold;">{totalReports}</span>
      reports in the city of zurich according to graffiti
    </div>
  </div>
  <div style="height: 100vh; border-top: 1px solid black;">
    <div class="animation" style="position: relative; margin-top: 0px">
      {#each statisticsByYear as stat}
        <h1>{stat.year}</h1>
        {#each Array(stat.totalReports) as _, row}i{/each}
      {/each}
    </div>
    <div>
      With 2020 being the most actively reported year ({statisticsByYear[0].totalReports}
      reports).
    </div>
  </div>
  <div style="height: 100vh; border-top: 1px solid black;">
    <h1>2020</h1>
    <div>
      Where you can see that Kreis 1 has been the most active when it comes to
      reports.
    </div>

    <div class="animation" style="position: relative; margin-top: 0px">
      {#each statisticsByDistrict[0].districts as district, index}
        {#if index === 0 || index === 1 || index === statisticsByDistrict[0].districts.length - 1}
          <h2>{district.name}</h2>
          {#each Array(district.totalReports) as _, row}i{/each}
        {/if}
      {/each}
    </div>

  </div>
  <div style="height: 1100px; border-top: 1px solid black;">
    <h1>2020</h1>
    <div>
      Where you can see that Kreis 1 has been the most active when it comes to
      reports.
    </div>
    <div
      class="animation"
      style="position: relative; margin-top: 0px; margin-bottom: 30px">
      {#each statisticsByDistrict as stats}
        <h2>{stats.year}</h2>
        {#each stats.districts as district, index}
          {#if index === 0 || index === 1 || index === statisticsByDistrict[0].districts.length - 1}
            <h3>{district.name}</h3>
            {#each Array(district.totalReports) as _, row}i{/each}
          {/if}
        {/each}
      {/each}
    </div>
  </div>
</main>
