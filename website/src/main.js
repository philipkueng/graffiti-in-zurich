import App from './App.svelte';
import data from './data/data.json';
import texts from './data/texts.json';

function resolveImages(filename) {
	const images = [
		"karte.svg",
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
		texts,
		resolveImages,
	}
});

export default app;