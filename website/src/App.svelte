<script>
  import VerticalStackedBar from "./components/VerticalStackedBar.svelte";
  import ColoredSvgMap from "./components/ColoredSvgMap.svelte";
  import viewport from "./helper/useViewportAction.js";

  export let data;
  export let steps;
  export let resolveImages;

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

  $: stepIndex = 0;
  $: currentComponent = getCurrentComponent(stepIndex);

  function getCurrentComponent(index) {
    let component = {};
    let step = steps[index];
    if (step.type === "teaser") {
      component.props = {
        ...step
      };
    } else if (step.type === "svgmap") {
      component.component = ColoredSvgMap;
      component.props = {
        resolveImages
      };
    } else {
      component.component = VerticalStackedBar;
      component.props = {
        data,
        activeYear: step.activeYear
      };
    }
    return component;
  }

  function getTop(component) {
    return component.component ? "8vh" : 0;
  }
</script>

<style>
  main {
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    font-family: "StreetWars";
    text-transform: uppercase;
    font-size: 6em;
    font-weight: 100;
  }

  .content-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    z-index: -1;
  }

  .content-frame {
    position: fixed;
    height: 70%;
    width: 100%;
  }

  .step-container {
    height: 100vh;
    width: 100%;
    z-index: 9999;
  }

  .step {
    height: 100vh;
    width: 100%;
  }
  .step-box {
    background-color: white;
    width: 100%;
    padding: 20px;
    z-index: 9999;
    box-shadow: 3px 5px 3px grey;
    border: 0.5px solid grey;
    margin-top: 10px;
  }

  .teaser {
    height: 100vh;
    color: black;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .zueri-flagge {
    width: 100%;
    background: linear-gradient(
      to top right,
      #268bcc calc(50% - 1px),
      #268bcc,
      white calc(50% + 1px)
    );
  }
</style>

<main>
  <div class="content-container">
    <div class="content-frame" style="top: {getTop(currentComponent)};">
      {#if !currentComponent.component}
        <div
          class="teaser zueri-flagge"
          use:viewport
          on:enterViewport={() => (stepIndex = 0)}>
          <div>
            <h1
              style="text-align: center; margin-top: 0px; margin-bottom: 0px;">
              {currentComponent.props.header}
            </h1>
            <h4 style="text-align: right;">

              <span
                style="font-family: 'StreetWars'; font-size: 35px; margin-left:
                4px;">
                von {currentComponent.props.author}
              </span>
            </h4>
          </div>
          <img style="height: 55%; " src={resolveImages('karte.svg')} alt="" />
        </div>
      {:else}
        <svelte:component
          this={currentComponent.component}
          {...currentComponent.props} />
      {/if}
    </div>
    <div class="step-container">
      {#each steps as step, index}
        <div
          class="step"
          use:viewport
          on:enterViewport={() => (stepIndex = index)}>
          {#if step.text}
            <div class="step-box">{step.text}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</main>
