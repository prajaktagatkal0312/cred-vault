const req = await fetch('https://indexer.preview.midnight.network/api/v4/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'query { __type(name: "ContractAction") { fields { name type { name kind ofType { name kind } } } } }' })
});
console.log(JSON.stringify(await req.json(), null, 2));
