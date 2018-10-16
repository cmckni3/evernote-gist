var recursiveWalk;

var libxmljs = require('libxmljs');
var Europa = require('node-europa');

var europa = new Europa();

recursiveWalk = function(node) {
  var child, childNodes, content, href, ref, ref1, text;
  switch (node.type()) {
    case 'text':
      return europa.convert(node.toString());
    case 'comment':
      return '';
    case 'entity_ref':
      return europa.convert(node.toString());
    case 'element':
      childNodes = (function() {
        var i, len, ref, results;
        ref = node.childNodes();
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          child = ref[i];
          results.push(recursiveWalk(child));
        }
        return results;
      })();
      content = childNodes.join('');
      switch (node.name()) {
        case 'en-media':
          return '';
        case 'en-crypt':
          // NOTE: Not supported
          return '';
        case 'en-note':
          return europa.convert(content);
        case 'en-todo':
          return " - [" + (node.attr('checked') ? 'x' : ' ') + "] ";
        default:
          return europa.convert(content);
      }
      break;
    default:
      throw Error("no rule to parse " + node);
  }
};

var toMarkdown = function(content) {
  if (content.indexOf('Mocha') >= 0) console.log(content);
  var xmlDoc = libxmljs.parseXml(content);
  return recursiveWalk(xmlDoc.root());
};

module.exports = {
  toMarkdown: toMarkdown
};
