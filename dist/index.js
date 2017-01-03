'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var postcss = require('postcss');
var safe = require('postcss-safe-parser');
var cssToObject = require('./css-to-object');

module.exports = function (babel) {
  return {
    visitor: {
      TaggedTemplateExpression: function TaggedTemplateExpression(path, state) {
        if (path.node.tag.name !== 'csjs') {
          return false;
        }

        var nodeQuasis = path.node.quasi.quasis;
        var nodeExprs = path.node.quasi.expressions;

        var css = nodeQuasis.reduce(function (acc, quasi, i) {
          var expr = nodeExprs[i] ? expressionPlaceholder(i) : '';
          return acc + quasi.value.raw + expr;
        }, '');

        var pluginsOpts = state.opts.plugins || [];

        var plugins = pluginsOpts.map(handlePlugin);

        var processed = postcss(plugins).process(css, { parser: safe, from: this.file.opts.filename }).css;

        var _splitExpressions = splitExpressions(processed),
            quasis = _splitExpressions.quasis,
            exprs = _splitExpressions.exprs;

        var quasisAst = buildQuasisAst(babel.types, quasis);
        var exprsAst = exprs.map(function (exprIndex) {
          return nodeExprs[exprIndex];
        });

        if (state.opts.cssToObject) {
          return path.replaceWithMultiple(cssToObject(processed, exprsAst, babel));
        }

        path.node.quasi.quasis = quasisAst;
        path.node.quasi.expressions = exprsAst;
      }
    }
  };
};

function handlePlugin(pluginArg) {
  if (Array.isArray(pluginArg)) {
    return require(pluginArg[0]).apply(null, pluginArg.slice(1));
  } else if (typeof pluginArg === 'string') {
    return require(pluginArg);
  } else {
    return pluginArg;
  }
}

function expressionPlaceholder(i) {
  return '___QUASI_EXPR_' + i + '___';
}

function buildQuasisAst(t, quasis) {
  return quasis.map(function (quasi, i) {
    var isTail = i === quasis.length - 1;
    return t.templateElement({ raw: quasi, cooked: quasi }, isTail);
  });
}

var regex = /___QUASI_EXPR_(\d+)___/g;

function splitExpressions(css) {
  var found = void 0,
      matches = [];
  while (found = regex.exec(css)) {
    matches.push(found);
  }

  var reduction = matches.reduce(function (acc, match) {
    acc.quasis.push(css.substring(acc.prevEnd, match.index));

    var _match = _slicedToArray(match, 2),
        placeholder = _match[0],
        exprIndex = _match[1];

    acc.exprs.push(exprIndex);
    acc.prevEnd = match.index + placeholder.length;
    return acc;
  }, { prevEnd: 0, quasis: [], exprs: [] });

  reduction.quasis.push(css.substring(reduction.prevEnd, css.length));

  return {
    quasis: reduction.quasis,
    exprs: reduction.exprs
  };
}