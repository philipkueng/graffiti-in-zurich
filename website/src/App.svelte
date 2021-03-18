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
    font-size: 5em;
    text-align: center;
    margin-bottom: 20px;
  }

  .texts {
    text-align: left;
    width: 100%;
    width: 49%;
    margin-top: 22px;
    font-family: "Roboto";
  }
</style>

<main class="zueri-flagge">
  <div class="header">Graffiti in Zuerich</div>
  <div
    style="width: 100%; display: flex; flex-direction: column;
    align-items:center;">
    <div
      style="width: 100%; display: flex; flex-direction: row; height: 100vh;
      justify-content: center;">
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
      <div class="texts">
        {@html texts.find(text => text.year === activeYear).text}
      </div>
    </div>
  </div>
</main>
<div
  style="margin-top: 16px; padding: 0px 50px; font-size: 0.7em; color: #949494 ">
  Repository auf
  <a
    href="https://github.com/philipkueng/graffiti-in-zurich"
    style="color: #949494; text-decoration: underline;">
    github
  </a>
</div>
