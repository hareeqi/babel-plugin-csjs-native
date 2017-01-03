'use strict';

var fs = require('fs');
var test = require('tape');
var babel = require('babel-core');

var pluginPath = require.resolve('../');

test('basic autoprefixing', function (t) {
  var output = babel.transformFileSync(__dirname + '/fixtures/autoprefixer.source', {
    plugins: [[pluginPath, {
      plugins: [require('autoprefixer')]
    }]]
  });

  var expected = fs.readFileSync(__dirname + '/fixtures/autoprefixer.expected', 'utf-8');

  t.equal(output.code.trim(), expected.trim(), 'output matches expected');
  t.end();
});

test('basic autoprefixing (string plugin name)', function (t) {
  var output = babel.transformFileSync(__dirname + '/fixtures/autoprefixer.source', {
    plugins: [[pluginPath, {
      plugins: ['autoprefixer']
    }]]
  });

  var expected = fs.readFileSync(__dirname + '/fixtures/autoprefixer.expected', 'utf-8');

  t.equal(output.code.trim(), expected.trim(), 'output matches expected');
  t.end();
});

test('basic autoprefixing (arguments)', function (t) {
  var output = babel.transformFileSync(__dirname + '/fixtures/autoprefixer.source', {
    plugins: [[pluginPath, {
      plugins: [['autoprefixer', { browsers: ['last 20 versions'] }]]
    }]]
  });

  var expected = fs.readFileSync(__dirname + '/fixtures/autoprefixer.old.expected', 'utf-8');

  t.equal(output.code.trim(), expected.trim(), 'output matches expected');
  t.end();
});