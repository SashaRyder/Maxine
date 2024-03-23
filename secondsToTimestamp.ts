export const secondsToTimestamp = (seconds: number): string => {
    const hours = `${Math.floor(seconds / 3600)}`.padStart(2, '0');
    const minutes = `${Math.floor((seconds % 3600) / 60)}`.padStart(2, '0');
    const remainingSeconds = `${Math.floor(seconds % 60)}`.padStart(2, '0');
    return `${hours}:${minutes}:${remainingSeconds}`;
}