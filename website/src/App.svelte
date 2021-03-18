<script>
  import ColoredSvgMap from "./components/ColoredSvgMap.svelte";

  export let data;
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
    font-size: 3em;
    text-align: left;
  }
</style>

<main class="zueri-flagge">
  <div class="header">Graffiti in Zuerich</div>
  <div
    style="width: 100%; display: flex; flex-direction: column;
    align-items:center;">
    <div
      style="width: 100%; display: flex; flex-direction: row; height: 100vh;
      margin-top: 20px;">
      <div style="width: 49%;">
        <div
          style="display: flex; flex-direction: row; align-items: baseline;
          justify-content: center; font-family: StreetWars; font-size: 45px">
          <div
            style="cursor: pointer; height: 100%; padding: 5px 30px;"
            on:click={() => changeIndex('minus', activeYear)}>
            &#60;
          </div>
          {#each data as entry}
            <div
              style="cursor: pointer; height: 100%; padding: 5px 30px;"
              class:active-year={activeYear === entry.year}
              on:click={() => (activeYear = entry.year)}>
              {entry.year}
            </div>
          {/each}
          <div
            style="cursor: pointer; height: 100%; padding: 5px 30px;"
            on:click={() => changeIndex('plus', activeYear)}>
            &#62;
          </div>
        </div>
        <ColoredSvgMap data={getData(data, activeYear)} />
      </div>
      <div style="text-align: left; width: 100%; width: 49%;">
        This is a text about something.
      </div>
    </div>
  </div>
</main>
