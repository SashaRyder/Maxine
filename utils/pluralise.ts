export const pluralise = (word: string, isPlural: boolean) => {
	if (isPlural) {
		return `${word}s`;
	}
	return word;
};
