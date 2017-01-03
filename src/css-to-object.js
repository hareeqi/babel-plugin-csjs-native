
var parse = require('./css-parser');

/*
  Most Transform code is taken from https://github.com/raphamorim/native-css
  Much apperiated ...
*/
function transform(rules) {
    var result = {}
    rules.forEach(function (rule) {
        var obj = {};
        if (rule.type === 'rule') {
            rule.declarations.forEach(function (declaration) {
                if (declaration.type === 'declaration') {
                  declaration.property = toCamelCase(declaration.property)
                  var is_nan = isNaN(Number(declaration.value))
                  obj[declaration.property] = is_nan? declaration.value : Number(declaration.value);
                }
            });
            rule.selectors.forEach(function (selector) {
                var name = nameGenerator(selector.trim());
                result[name] = obj;
            });
        }
    });
   return result
}
var nameGenerator = function (name) {
    name = name.replace(/\s\s+/g, ' ');
    name = name.replace(/[^a-zA-Z0-9]/g, '_');
    name = name.replace(/^_+/g, '');
    name = name.replace(/_+$/g, '');
    return name;
}
var toCamelCase = function(name) {
    return name.replace(/(-.)/g, function(v) { return v[1].toUpperCase(); })
}


module.exports = (css,expres,babel) =>{
  css = JSON.stringify(transform(parse(css).stylesheet.rules));
  css = concatExprse(css,expres, babel);
  var result = babel.transform('('+css+')');
  return result.ast.program.body
}

function concatExprse(css,expres,babel) {
  expres = getExprse(babel,expres)
  return css.replace(/\"___QUASI_EXPR_(\d+)___\"/g, function(e,i) {return expres[i] })
}
function getExprse(babel, asts){
  return asts.map(ast=>{
      var res = babel.transform('({})').ast;
      res.program.body = [ast]
      return babel.transformFromAst(res).code
    })
}
