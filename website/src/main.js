import App from './App.svelte';
import data from './data/data.json';
import steps from './data/steps.json';

const app = new App({
	target: document.body,
	props: {
		data,
		steps
	}
});

export default app;