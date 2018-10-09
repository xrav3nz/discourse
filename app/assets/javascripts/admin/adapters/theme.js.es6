import RestAdapter from "discourse/adapters/rest";

export default RestAdapter.extend({
  basePath() {
    return "/admin/";
  },

  afterFindAll(results) {
    const map = {};
    results.forEach(theme => {
      map[theme.id] = theme;
    });

    results.forEach(theme => {
      const components = theme.get("allComponents");
      const children = theme.get("child_themes") || [];

      children.forEach(c => {
        const child = map[c.id];
        const parents = child.get("parentThemes");

        components.pushObject(child);
        parents.pushObject(theme);
      });
    });

    return results;
  },

  jsonMode: true
});
