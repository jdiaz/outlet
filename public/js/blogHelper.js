function fromWhitespaceToDashes(title){
		return title.replace(/ +/g,'-');
	}

function fromDashToWhitespace(title){
		return title.replace(/-/g,' ');
}