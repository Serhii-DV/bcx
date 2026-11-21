export function formatTelegramHashtag(name: string): string | undefined {
  const separated = name
    .normalize('NFC')
    .replace(/&/g, ' And ')
    .replace(/[^\p{L}\p{Nd}]+/gu, '_')
    .replace(/^_|_$/g, '');
  // TDLib requires a letter and recognizes up to 256 code points after #.
  const tag = Array.from(separated).slice(0, 256).join('').replace(/_$/, '');
  return /\p{L}/u.test(tag) ? `#${tag}` : undefined;
}
