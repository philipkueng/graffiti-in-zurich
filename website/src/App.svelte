<script>
  import ColoredSvgMap from "./components/ColoredSvgMap.svelte";

  export let data;
  export let texts;

  let activeYear = 2018;

  function getData(data, activeYear) {
    return data.find(stats => stats.year === activeYear);
  }

  function getText(texts, activeYear) {
    let text = texts.find(text => text.year === activeYear);
    if (text) return text.text;
  }
</script>

<style>
  .zueri-flagge {
    width: 60px;
    height: 60px;
    margin-right: 16px;
    display: inline-flex;
    background: linear-gradient(
      to top right,
      #268bcc calc(50% - 1px),
      #268bcc,
      white calc(50% + 1px)
    );
    border: 1px solid #268bcc;
  }

  main {
    height: 100vh;
    padding: 20px;
  }
  .active-year {
    font-weight: bold;
    font-size: 1.3em;
    text-decoration: underline;
  }

  .header {
    font-family: StreetWars;
    font-size: 6em;
    text-align: center;
    margin-bottom: 30px;
  }

  .texts {
    text-align: left;
    width: 40%;
    margin-top: 76px;
    font-family: "Roboto";
    line-height: 25px;
  }

  .slider-container {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    justify-content: space-around;
    font-family: Roboto;
    font-size: 1.5em;
    width: 60%;
    margin-bottom: 4px;
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
    width: 44%;
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
  }

  .related-info {
    margin-top: 16px;
    padding: 0px 50px;
    font-size: 0.7em;
    color: #949494;
  }
</style>

<main class="">
  <div class="header">
    <div class="zueri-flagge" />
    Graffiti in der Stadt Zuerich*
  </div>
  <div class="component-container">
    <div class="map">
      <div class="slider-container">
        {#each data as entry}
          <div
            class="slider"
            class:active-year={activeYear === entry.year}
            on:click={() => (activeYear = entry.year)}>
            {entry.year}
          </div>
        {/each}
      </div>
      <ColoredSvgMap data={getData(data, activeYear)} />
    </div>
    <div class="texts">
      <p>
        {@html getText(texts, activeYear)}
      </p>
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
