import slug from 'slug';

export const slugifyFileName = (name, mimetype) => {
  // slugify file names in order to avoid problems on the markdown
  if (name.lastIndexOf('.') === -1) {
    name = `${name}.${mimetype.split('/')[1]}`;
  }
  return `${slug(name.substr(0, name.lastIndexOf('.')))}${name.substr(name.lastIndexOf('.'))}`;
};
