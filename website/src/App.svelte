<script>
  export let data;

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
    <h1 style="margin-top: 180px; margin-bottom: 20px;">Graffiti in Zürich</h1>
    <h1 style="margin-top: 12px;">2018 - 2020</h1>
    <h3>von Philip Küng, sfgb:b IAD11</h3>
  </div>
  <div style="height: 100vh; border-top: 1px solid black;">
    <div class="animation" style="position: relative; margin-top: 300px">
      {#each Array(totalReports) as _, row}o{/each}
    </div>
    <div>
      In den Jahren 2018, 2019 und 2020 sind, gemäss der Dienststelle
      <a href="#todo">züri-wie-neu</a>
      , insgesammt
      <span style="font-weight: bold;">{totalReports}</span>
      Meldungen bezüglich Graffiti eingegangen.
    </div>
  </div>
  <div style="height: 100vh; border-top: 1px solid black;">
    <div class="animation" style="position: relative; margin-top: 0px">
      {#each statisticsByYear as stat}
        <h1>{stat.year}</h1>
        {#each Array(stat.totalReports) as _, row}o{/each}
      {/each}
    </div>
    <div>
      Das Jahr 2020 war mit {statisticsByYear[0].totalReports} Meldungen das
      aktivste Jahr.
    </div>
  </div>
  <div style="height: 100vh; border-top: 1px solid black;">
    <h1>2020</h1>
    <div>
      Im Kreis 1 wurde Where you can see that Kreis 1 has been the most active
      when it comes to reports.
    </div>

    <div class="animation" style="position: relative; margin-top: 0px">
      {#each statisticsByDistrict[0].districts as district, index}
        {#if index === 0 || index === 1 || index === statisticsByDistrict[0].districts.length - 1}
          <h2>{district.name}</h2>
          {#each Array(district.totalReports) as _, row}o{/each}
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
            {#each Array(district.totalReports) as _, row}o{/each}
          {/if}
        {/each}
      {/each}
    </div>
  </div>
</main>
