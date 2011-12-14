describe ('JSONEnforcer.Template', function() {

  describe ('type checking', function() {

    var util = JSONEnforcer.util,
        a_string = '', a_number = 0, an_array = [], an_object = {};

    describe('#is_string', function() {

      it ('should return true for a string', function() {
        expect(util.is_string(a_string)).toBe(true);
      });
    });

    describe('#is_number', function() {

      it ('should return true for a number', function() {
        expect(util.is_number(a_number)).toBe(true);
      });
    });

    describe('#is_array', function() {

      it ('should return true for an array', function() {
        expect(util.is_array(an_array)).toBe(true);
      });

      it ('should fail for an object', function() {
        expect(util.is_array(an_object)).toBe(false);
      });
    });

    describe('#is_object', function() {

      it ('should return true for an object', function() {
        expect(util.is_object(an_object)).toBe(true);
      });

      it ('should fail for an array', function() {
        expect(util.is_object(an_array)).toBe(false);
      });
    });
  });
  
  it ('should handle strings', function() {
    expect(new JSONEnforcer.Template({ name: 'string' }).enforce({ name: 'brendan' })).toBe(true);
  });
  
  it ('should handle numbers', function() {
    expect(new JSONEnforcer.Template({ age: 'number' }).enforce({ age: 10 })).toBe(true);
  });
  
  it ('should handle arrays', function() {
    expect(new JSONEnforcer.Template({ hobbies: 'array' }).enforce({ hobbies: [ 'guitar', 'hiking' ] })).toBe(true);
  });
  
  it ('should handle objects', function() {
    
    expect(new JSONEnforcer.Template({ 
      attributes: {
        eyes: 'string', 
        hair: 'string'
      }
    }).enforce({
      attributes: { 
        eyes: 'blue', 
        hair: 'brown' 
      }
    })).toBe(true);    
  });
  
  it ('should enforce required strings', function() {
    expect(new JSONEnforcer.Template({ name: 'string optional' }).enforce({})).toBe(true); 
    expect(new JSONEnforcer.Template({ name: 'string' }).enforce({})).toBe(false);
  });

  it ('should enforce required numbers', function() {
    expect(new JSONEnforcer.Template({ age: 'number optional' }).enforce({})).toBe(true);
    expect(new JSONEnforcer.Template({ age: 'number' }).enforce({})).toBe(false);
  });
  
  it ('should enforce required arrays', function() {
    expect(new JSONEnforcer.Template({ hobbies: [ 'string optional' ] }).enforce({ hobbies: [] })).toBe(true);
    expect(new JSONEnforcer.Template({ hobbies: [ 'string' ] }).enforce({})).toBe(false);
  });
  
  it ('should enforce required objects', function() {
    
    expect(new JSONEnforcer.Template({ 
      attributes: {
        eyes: 'string',
        hair: 'string optional'
      }
    }).enforce({
      attributes: {
        eyes: 'blue' 
      }
    })).toBe(true);
    
    expect(new JSONEnforcer.Template({ 
      attributes: {
        eyes: 'string optional',
        hair: 'string'
      }
    }).enforce({
      attributes: {
        eyes: 'blue'
      }
    })).toBe(false);
  });
  
  it ('should support multiple type checks', function() {
    expect(new JSONEnforcer.Template({ name: 'string array' }).enforce({ name: 'brendan' })).toBe(true);
    expect(new JSONEnforcer.Template({ name: 'string array' }).enforce({ name: [ 'brendan', 'bbarr' ] })).toBe(true);
  });

});

describe ('JSONEnforcer.Stub', function() {
  
  beforeEach (function() {
    this.addMatchers({
      toBeArray: function() {
        var actual = this.actual;
        return actual && typeof actual === 'object' && typeof actual.length !== 'undefined';
      },
      toBeObject: function() {
        var actual = this.actual;
        return actual && typeof actual === 'object' && typeof actual.length === 'undefined';
      },
      toBeNumber: function() {
        return typeof this.actual === 'number';
      }
    });
  });
  
  describe ('basic stubbing', function() {
    
    it ('should stub strings', function() {
      var template = { a: 'string' };
      expect(new JSONEnforcer.Stub(template).generate()).toEqual({ a: 'Sample string, property: "a"' });
    });

    it ('should stub numbers', function() {
      var template = { a: 'number' };
      expect(new JSONEnforcer.Stub(template).generate().a).toBeNumber();      
    });    

    it ('should stub arrays', function() {
      var template = { a: 'string', b: [ 'number' ] };
      expect(new JSONEnforcer.Stub(template).generate().b).toBeArray();      
      expect(new JSONEnforcer.Stub(template).generate().b[0]).toBeNumber();
    });

    it ('should stub objects', function() {
      var template = { a: { b: [ 'number' ] }};
      expect(new JSONEnforcer.Stub(template).generate().a.b).toBeArray();
      expect(new JSONEnforcer.Stub(template).generate().a.b[0]).toBeNumber();
    });

    it ('should stub empty arrays', function() {
      var template = { a: { b: [] }};
      expect(new JSONEnforcer.Stub(template).generate().a.b).toBeArray();
      expect(new JSONEnforcer.Stub(template).generate().a.b[0]).not.toBeDefined();
    });

    it ('should stub empty objects', function() {
      var template = { a: {} };
      expect(new JSONEnforcer.Stub(template).generate().a).toBeObject();
    });

    it ('should stub nested objects', function() {
      var template = { a: { b: 'string', c: [ [ { d: 'number' } ] ]}};
      expect(new JSONEnforcer.Stub(template).generate().a.c[0][0].d).toBeNumber();
    });
  });
  
  describe ('complex stubbing rules', function() {
    
    it ('should stub with number range', function() {
      var template = { a: 'number[1-1]' }
    });
    
    it ('should stub with string length range', function() {
      
    });
    
  });
});  