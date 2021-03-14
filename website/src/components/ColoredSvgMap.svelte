<script>
  // export let colorConfig;
  let colorConfig = [
    { district: "Kreis 1", color: "red" },
    { district: "Kreis 2", color: "blue" }
  ];
  export let resolveImages;

  let svg = resolveImages("karte.svg");

  function applyColorsToSvg(svg, colorConfig) {
    let style = [];
    colorConfig.map(
      config =>
        (style = [
          ...style,
          `.${config.district.replace(" ", "")} { color: ${config.color} }`
        ])
    );
    console.log(style);
    console.log(svg);
    return svg;
  }

  applyColorsToSvg(svg, colorConfig);
</script>

<style>

</style>

<div>
  <img style="height: 20%;" src={resolveImages('karte.svg')} alt="" />
</div>
