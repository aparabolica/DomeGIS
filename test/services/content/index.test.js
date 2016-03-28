'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('content service', () => {
  it('registered the contents service', () => {
    assert.ok(app.service('contents'));
  });
});
