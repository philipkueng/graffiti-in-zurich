<script>
  import VerticalStackedBar from "./components/VerticalStackedBar.svelte";
  import HorizontalStackedBar from "./components/HorizontalStackedBar.svelte";
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

  export let data;
  export let steps;
  let totalReports = 0;
  data.map(year => (totalReports += year.totalReports));

  let stepIndex = 1;

  let currentComponent;

  $: currentColor = red;

  function getCurrentDisplay(index) {
    import("./components/VerticalStackedBar.svelte").then(
      res => (currentComponent = res.default)
    );
  }
  getCurrentDisplay(1);

  function elementInViewport(index) {
    let el = document.querySelectorAll(`.step-${index}`);
    var top = el.offsetTop;
    var left = el.offsetLeft;
    var width = el.offsetWidth;
    var height = el.offsetHeight;
    while (el.offsetParent) {
      el = el.offsetParent;
      top += el.offsetTop;
      left += el.offsetLeft;
    }
    return (
      top >= window.pageYOffset &&
      left >= window.pageXOffset &&
      top + height <= window.pageYOffset + window.innerHeight &&
      left + width <= window.pageXOffset + window.innerWidth
    );
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
  .content-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .content-frame {
    position: fixed;
    top: 15vh;
    /* background-color: yellow; */
    height: 70%;
    width: 100%;
    padding: 0 20px;
  }

  .step-container {
    height: 100vh;
    width: 100%;
  }

  .step {
    border: 2px solid black;
    height: 30px;
    width: 50px;
  }
</style>

<main>
  <div
    style="height: 100vh; display: flex; flex-direction: column; align-items:
    center;">
    <h1 style="margin-bottom: 10px;">Graffiti in Zürich</h1>
    <h1 style="margin-top: 10px;">2018 - 2020</h1>
    <h3>von Philip Küng, sfgb:b IAD11</h3>
    <img
      style="height: 50%; width: 50%;"
      src="https://www.zkb.ch/media/contenthub-immobilien/bilder/content/bilder-stories/ZH_Stadtkreise.img.1557942666008.940.png"
      alt="" />
  </div>
  <div class="content-container" style="height: 100vh;">
    <div class="content-frame">
      <!-- <svelte:component this={currentComponent} {data} activeYear={false} /> -->
      <div style="height: 50%; width: 50%; background-color: {currentColor};" />
    </div>
    {#each steps as step, index}
      <div class="step-container">
        <span class="step">{step.text} {elementInViewport(index)}</span>
      </div>
    {/each}
  </div>
  <!-- <div
    style="">
    {#each data as statistic}
      <div class="statistics-year">
        <VerticalStackedBar districts={statistic.districts} active={false} />
        <h3>{statistic.year}</h3>
      </div>
    {/each}
  </div>

  <div
    style="display: flex; flex-direction: row; height: 100vh; align-items:
    flex-end;">
    {#each data as statistic}
      <div class="statistics-year">
        <VerticalStackedBar
          districts={statistic.districts}
          active={statistic.year === 2018} />
        <h3>{statistic.year}</h3>
      </div>
    {/each}
  </div>
  <div
    style="height: 100vh; display: flex; flex-direction: column;
    justify-content: center;">
    <h1>{data[0].year}</h1>

    <HorizontalStackedBar
      districts={data[0].districts}
      totalReports={data[0].totalReports}
      {districtColors} />
  </div>

  <div
    style="display: flex; flex-direction: row; height: 100vh; align-items:
    flex-end;">
    {#each data as statistic}
      <div class="statistics-year">
        <VerticalStackedBar
          districts={statistic.districts}
          active={statistic.year === 2019} />
        <h3>{statistic.year}</h3>
      </div>
    {/each}
  </div>
  <div
    style="height: 100vh; display: flex; flex-direction: column;
    justify-content: center;">
    <h1>{data[1].year}</h1>

    <HorizontalStackedBar
      districts={data[1].districts}
      totalReports={data[1].totalReports}
      {districtColors} />
  </div>

  <div
    style="display: flex; flex-direction: row; height: 100vh; align-items:
    flex-end;">
    {#each data as statistic}
      <div class="statistics-year">
        <VerticalStackedBar
          districts={statistic.districts}
          active={statistic.year === 2020} />
        <h3>{statistic.year}</h3>
      </div>
    {/each}
  </div>
  <div
    style="height: 100vh; display: flex; flex-direction: column;
    justify-content: center;">
    <h1>{data[2].year}</h1>

    <HorizontalStackedBar
      districts={data[2].districts}
      totalReports={data[2].totalReports}
      {districtColors} />
  </div>
  -->
</main>
