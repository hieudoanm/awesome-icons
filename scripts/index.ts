import fs from 'fs';
import groupBy from 'lodash/groupBy';

const walk = async (dir: string, rootDir: string): Promise<string[]> => {
  let files: string[] = [];
  const list = await fs.readdirSync(dir);
  for (let file of list) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      const list = await walk(file, rootDir);
      files = files.concat(list);
    } else {
      /* Is a file */
      files.push(file);
    }
  }
  return files.map((file: string) => file.replace(rootDir, ''));
};

const lowercase = async (svgFiles: string[]) => {
  const filePaths: Array<string> = [];
  for (const name of svgFiles) {
    const lower: string = name.toLowerCase();
    console.log(lower);
    if (name === lower) {
      filePaths.push(lower);
      continue;
    }
    const oldName = `./svg/${name}`;
    const newName = `./svg/${lower}`;
    const svg: string = await fs.readFileSync(oldName, 'utf-8');
    await fs.unlinkSync(oldName);
    await fs.writeFileSync(newName, svg);
  }
  filePaths.sort();
  return filePaths;
};

const main = async () => {
  let filePaths: Array<string> = await walk('./svg', './svg/');
  filePaths = await lowercase(filePaths);
  filePaths = filePaths.filter((filePath) => !filePath.includes('-full'));

  console.log(filePaths.length);

  const fileNamesByCategories = groupBy(
    filePaths.map((filePath) => {
      const [category, subcategory, fileName] = filePath.split('/');
      return { category, subcategory, fileName };
    }),
    'category'
  );
  const categories = Object.keys(fileNamesByCategories);

  const heading1 = `# Icons (${filePaths.length})\n\n`;
  const body = categories
    .map((category) => {
      const fileNamesByCategory = fileNamesByCategories[category];
      const heading2 = `## ${category} (${fileNamesByCategory.length})\n\n`;
      const fileNamesBySubcategories = groupBy(
        fileNamesByCategory,
        'subcategory'
      );
      const subcategories = Object.keys(fileNamesBySubcategories);
      const sections = subcategories
        .map((subcategory) => {
          const fileNamesBySubcategory = fileNamesBySubcategories[subcategory];
          const heading3 = `### ${subcategory} (${fileNamesBySubcategory.length})\n\n`;
          const icons = fileNamesBySubcategory
            .map(({ category, subcategory, fileName }) => {
              const src = `https://raw.githubusercontent.com/hieudoanm/awesome-icons/master/svg/${category}/${subcategory}/${fileName}`;
              const image = `<div style="display:inline-flex;justify-content:center;align-items:center;width:48px">
  <a href="${src}" target="_blank">
    <img src="${src}" alt="${fileName}" title="${fileName}" height="32px" />
  </a>
</div>`;
              return image;
            })
            .join('\n');
          return heading3 + icons;
        })
        .join('\n\n');

      return heading2 + sections;
    })
    .join('\n\n');
  // Markdown
  const markdown: string = heading1 + body + '\n';

  await fs.writeFileSync('./README.md', markdown);
};

main().catch((error: Error) => console.error(error));
