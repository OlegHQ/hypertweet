export function typeRedditComment(text: string): boolean {
	// Find the Reddit comment composer
	const composer = document.querySelector('shreddit-composer');
	if (!composer) {
		console.log("Reddit composer not found");
		return false;
	}

	// Find the contenteditable div with the textbox
	const textbox = composer.querySelector('div[contenteditable="true"][role="textbox"]') as HTMLElement;
	if (!textbox) {
		console.log("Textbox not found in shadow DOM");
		return false;
	}

	// Clear existing content
	textbox.innerHTML = '';

	// Split text into lines for proper paragraph structure
	const lines = text.split('\n');

	lines.forEach((line, index) => {
		// Create a paragraph element with the Reddit structure
		const paragraph = document.createElement('p');
		paragraph.className = 'first:mt-0 last:mb-0';
		paragraph.setAttribute('dir', 'ltr');

		if (line.trim()) {
			// Create the span with lexical-text attribute
			const span = document.createElement('span');
			span.setAttribute('data-lexical-text', 'true');
			span.textContent = line;
			paragraph.appendChild(span);
		} else {
			// Empty paragraph for blank lines
			paragraph.innerHTML = '<br>';
		}

		textbox.appendChild(paragraph);
	});

	// If text is empty, add a single paragraph with placeholder
	if (!text.trim()) {
		const paragraph = document.createElement('p');
		paragraph.className = 'first:mt-0 last:mb-0';
		paragraph.innerHTML = '<br>';
		textbox.appendChild(paragraph);
	}

	// Trigger input event to notify Reddit's JavaScript
	const inputEvent = new InputEvent('input', {
		bubbles: true,
		composed: true,
		inputType: 'insertText',
		data: text
	});
	textbox.dispatchEvent(inputEvent);

	// Focus the textbox to make sure Reddit recognizes the content
	textbox.focus();

	// Place cursor at the end
	const range = document.createRange();
	const selection = window.getSelection();
	if (textbox.lastChild) {
		range.selectNodeContents(textbox.lastChild);
		range.collapse(false);
		selection?.removeAllRanges();
		selection?.addRange(range);
	}

	return true;
}

