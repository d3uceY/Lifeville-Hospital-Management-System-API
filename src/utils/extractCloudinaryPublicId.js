export const extractPublicId = (url) => {
    const parts = url.split('/upload/').pop()?.split('/') ?? [];
    const withoutVersion = parts.slice(1).join('/');
    return withoutVersion.split('.').slice(0, -1).join('.');
}
