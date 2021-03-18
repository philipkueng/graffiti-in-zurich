<script>
  import ColoredSvgMap from "./components/ColoredSvgMap.svelte";

  export let data;
  export let texts;

  let activeYear = 2018;

  function getData(data, activeYear) {
    return data.find(stats => stats.year === activeYear);
  }

  function changeIndex(method, activeYear) {
    if (method === "minus") {
      if (activeYear === 2018) return;
      console.log("sub");
      activeYear -= 1;
    } else {
      if (activeYear === 2020) return;
      console.log("add");
      activeYear += 1;
      console.log(activeYear);
    }
  }
</script>

<style>
  .zueri-flagge {
    width: 100%;
    background: linear-gradient(
      to top right,
      #268bcc calc(50% - 1px),
      #268bcc,
      white calc(50% + 1px)
    );
  }

  main {
    height: 100vh;
    padding: 20px;
  }
  .active-year {
    font-weight: bold;
    font-size: 1.2em;
  }

  .header {
    font-family: StreetWars;
    font-size: 6em;
    text-align: center;
    margin-bottom: 20px;
  }

  .texts {
    text-align: left;
    width: 100%;
    width: 49%;
    margin-top: 10px;
    font-family: "Roboto";
  }

  .slider-container {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    justify-content: center;
    font-family: Roboto;
    font-size: 1.5em;
  }

  .component-container {
    width: 100%;
    display: flex;
    flex-direction: row;
    height: 100vh;
    justify-content: center;
  }
  .slider {
    cursor: pointer;
    height: 100%;
  }

  .map {
    width: 49%;
  }

  .related-info {
    margin-top: 16px;
    padding: 0px 50px;
    font-size: 0.7em;
    color: #949494;
  }
</style>

<main class="zueri-flagge">
  <div class="header">Graffiti in Zuerich</div>
  <div class="component-container">
    <div class="map">
      <div class="slider-container">
        <div class="slider" on:click={() => changeIndex('minus', activeYear)}>
          &#60;
        </div>
        {#each data as entry}
          <div
            class="slider"
            class:active-year={activeYear === entry.year}
            on:click={() => (activeYear = entry.year)}>
            {entry.year}
          </div>
        {/each}
        <div class="slider" on:click={() => changeIndex('plus', activeYear)}>
          &#62;
        </div>
      </div>
      <ColoredSvgMap data={getData(data, activeYear)} />
    </div>
    <div class="texts">
      {@html texts.find(text => text.year === activeYear).text}
    </div>
  </div>
</main>
<footer class="related-info">
  Repository auf
  <a
    href="https://github.com/philipkueng/graffiti-in-zurich"
    style="color: #949494; text-decoration: underline;">
    github
  </a>
</footer>
