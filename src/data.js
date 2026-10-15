const batches = import.meta.glob('./data/recipes/*.json', {eager:true,import:'default'});
export const recipes = Object.values(batches).flatMap(batch => Array.isArray(batch)?batch:(batch.recipes||[]));
export const recipeById = new Map(recipes.map(recipe=>[recipe.id,recipe]));
export const expectedCounts = {jin:50,chuan:50,xiang:40,lu:40,yue:40,jiangzhe:40,'western-dessert':40};
