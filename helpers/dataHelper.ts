export function parseMenuDescription(menuDescription: any) {
    if (!menuDescription || typeof menuDescription !== 'string') {
        return [];
    }

    return menuDescription
        .split('\n')
        .flatMap(line => line.split(','))
        .map(item =>
            item
                .trim()
                .replace(/^(\d+\.|-|\*)\s*/, '')
        )
        .filter(item => item.length > 0);
}