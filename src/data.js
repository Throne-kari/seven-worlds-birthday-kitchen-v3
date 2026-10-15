const batches = import.meta.glob('./data/recipes/*.json', {eager:true,import:'default'});
// Remove the legacy internal field reference from display copy; retain the frozen source.
const legacyTimerHint = '本步骤含主动操作和静置等待；总时长已包含等待，详见 action。';
export const recipes = Object.values(batches).flatMap(batch => Array.isArray(batch)?batch:(batch.recipes||[])).map(recipe => ({
  ...recipe,
  steps: recipe.steps.map(step => step.timerHint === legacyTimerHint
    ? {...step, timerHint: '本步骤含主动操作和静置等待；总时长已包含等待。'}
    : step),
}));
export const recipeById = new Map(recipes.map(recipe=>[recipe.id,recipe]));
export const expectedCounts = {jin:50,chuan:50,xiang:40,lu:40,yue:40,jiangzhe:40,'western-dessert':40};
