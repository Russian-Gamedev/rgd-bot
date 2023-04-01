import replaces from './replaces';

export function khaleesiGenerate(text: string) {
  const regex = new RegExp(Object.keys(replaces).join('|'), 'gi');

  const res = text.replace(regex, function (matched) {
    return replaces[matched.toLowerCase()];
  });

  return res.replaceAll('и', 'i');
}
