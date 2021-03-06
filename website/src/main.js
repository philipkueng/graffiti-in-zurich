import App from './App.svelte';
import statisticsByYear from './data/statisticsByYear.json'
import statisticsByDistrict from './data/statisticsByDistrict.json'

const app = new App({
	target: document.body,
	props: {
		statisticsByYear,
		statisticsByDistrict
	}
});

export default app;