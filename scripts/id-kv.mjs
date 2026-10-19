// Lee la lista de espacios KV que imprime «wrangler kv namespace list» y escribe el ID del que
// tiene el nombre pedido. Sirve cuando el secreto KV_ID trae el nombre en lugar del ID.
const name = process.argv[2];
let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  const start = input.search(/\[\s*[{\]]/);
  const list = start >= 0 ? JSON.parse(input.slice(start)) : [];
  const found = list.find((ns) => ns.title === name) ?? list.find((ns) => ns.title.toLowerCase() === name.toLowerCase());
  if (!found) {
    console.error(`No hay ningún espacio KV llamado «${name}». Existen: ${list.map((ns) => ns.title).join(', ') || 'ninguno'}.`);
    process.exit(1);
  }
  console.log(found.id);
});
