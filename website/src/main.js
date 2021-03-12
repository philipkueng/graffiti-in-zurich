import App from './App.svelte';
import data from './data/data.json';
import steps from './data/steps.json';

function resolveImages(filename) {
	const images = [
		"karte.png",
	];
	if (images.includes(filename)) {
		return `images/${filename}`;
	}
	return null;
}

const app = new App({
	target: document.body,
	props: {
		data,
		steps,
		resolveImages,
	}
});

export default app;