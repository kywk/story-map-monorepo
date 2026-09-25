module.exports = function storyMapClientPlugin() {
  return {
    name: 'story-map-client',
    getClientModules() {
      return [require.resolve('@story-map/remark-story-map/client')];
    },
  };
};
