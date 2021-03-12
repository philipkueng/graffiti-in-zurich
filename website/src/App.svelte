<script>
  import VerticalStackedBar from "./components/VerticalStackedBar.svelte";
  import HorizontalStackedBar from "./components/HorizontalStackedBar.svelte";
  import viewport from "./helper/useViewportAction.js";

  export let data;
  export let steps;

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
    if (step.type === "horizontal") {
      component.component = HorizontalStackedBar;
      component.props = {
        data,
        activeYear: step.activeYear,
        districtColors
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

  function setNewStepIndex() {
    if (stepIndex > 0) {
      stepIndex -= 1;
    }
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
    z-index: -1;
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
    z-index: 9999;
  }

  .step {
    height: 100vh;
    width: 100%;
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
      <svelte:component
        this={currentComponent.component}
        {...currentComponent.props} />
    </div>
    <div class="step-container">
      {#each steps as step, index}
        <div
          class="step"
          use:viewport
          on:enterViewport={() => (stepIndex = index)}
          on:exitViewport={() => setNewStepIndex()}>
          <div style="background-color: white: padding: 5px; z-index: 9999;">
            {step.text}
          </div>
        </div>
      {/each}
    </div>
  </div>
</main>
