# CSS Selector
[![Build Status](https://api.travis-ci.org/martinsbalodis/css-selector.svg)](https://travis-ci.org/martinsbalodis/css-selector)

CSS selector can be used to retrieve CSS selector for a given element in DOM. The resulting selector will be optimized to be as short as possible.
CSS selector can be retrieved also for multiple elements. In such case the resulting selector might be a much wider CSS selector which will point to similar elements.

## Usage
```javascript
var selector = new CssSelector({
		parent: document,
		enableResultStripping: true,
		ignoredTags: ['font'],
		enableSmartTableSelector: true,
		allowMultipleSelectors: false,
		query: jQuery,
		ignoredClasses: [
			'my-class'
		]
	});
var elements = document.getElementsByClassName('my-class');
var result_selector = selector.getCssSelector(elements);
// #id div:nth-of-type(1) .another-class
```

## Features

 - Tag name selector
 - Id selector
 - Class name selector
 - nth-of-child selector
 - Direct Child selector (a > b)
 - Smart table selector

### Smart table selector
For example you have a table like you can see below and you need to get the CSS selector for `<td>banana</td>`. The selector could be retrieved with `nth-of-child` selector. But in this case the resulting selector wouldn't be a very strong one. Using smart table you would get CSS selector like this `tr:contains('title:') td:nth-of-type(2)`.
```html
<table>
    <tr><td>title:</td><td>banana</td></tr>
    <tr><td>color:</td><td>yellow</td></tr>
</table>
```

## Contributions
Please include tests for added features.

## License
LGPLv3
