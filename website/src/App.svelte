<script>
  export let data;
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
  <div style="height: 700px">
    <h1 style="margin-top: 180px; margin-bottom: 20px;">Graffiti in Zurich</h1>
    <h1 style="margin-top: 12px;">2018 - 2020</h1>
    <h3>by Philip Küng, sfgb:b IAD11</h3>
  </div>
  <div style="height: 700px; border-top: 1px solid black;">
    <p>during the years</p>
  </div>

</main>

<p>{JSON.stringify(data)}</p>
