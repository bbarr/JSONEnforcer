describe ('Utilities', function() {

  describe('#is_string', function() {

    it ('should return true for a string', function() {
      expect(JSONEnforcer.__exec__('util.is_string()', '')).toBe(true);
    });
  });

  describe('#is_number', function() {

    it ('should return true for a number', function() {
      expect(JSONEnforcer.__exec__('util.is_number()', 11)).toBe(true);
    });
  });

  describe('#is_array', function() {

    it ('should return true for an array', function() {
      expect(JSONEnforcer.__exec__('util.is_array()', [])).toBe(true);
    });

    it ('should fail for an object', function() {
      expect(JSONEnforcer.__exec__('util.is_array()', {})).toBe(false);
    });
  });

  describe('#is_object', function() {

    it ('should return true for an object', function() {
      expect(JSONEnforcer.__exec__('util.is_object()', {})).toBe(true);
    });

    it ('should fail for an array', function() {
      expect(JSONEnforcer.__exec__('util.is_object()', [])).toBe(false);
    });
  });
  
});

describe ('Rules', function() {
  
  var Rules = JSONEnforcer.__exec__('Rules');
  
  it ('should parse validations for strings', function() {
    var rules = new Rules('string(\\w+)');
    expect(rules.validation).toEqual(/\w+/);
  });
  
  it ('should parse range for numbers', function() {
    var rules = new Rules('number(1,3)');
    expect(rules.range).toEqual([1,3]);
  });
});

describe ('Lexer', function() {
  
  var Lexer = JSONEnforcer.__exec__('Lexer');
  
  describe ('tokenization', function() {
    
    it ('should tokenize literal', function() {
      var lex = new Lexer("abc");
      lex._tokenize();
      expect(lex.tokenized[0].name).toEqual('literal');
      expect(lex.tokenized[0].value).toEqual('a');
      expect(lex.tokenized[1].name).toEqual('literal');
      expect(lex.tokenized[1].value).toEqual('b');
      expect(lex.tokenized[2].name).toEqual('literal');
      expect(lex.tokenized[2].value).toEqual('c');        
    });

    it ('should tokenize special', function() {
      var lex = new Lexer('\\w');
      lex._tokenize();
      expect(lex.tokenized[0].name).toEqual('special');
      expect(lex.tokenized[0].value).toEqual('\\w');    
    });

    it ('should tokenize set', function() {
      var lex = new Lexer('[abc]');
      lex._tokenize();
      expect(lex.tokenized[0].name).toEqual('set');
      expect(lex.tokenized[0].value).toEqual('[abc]');
    });

    it ('should tokenize quantifier', function() {
      var lex = new Lexer('{1,4}');
      lex._tokenize();
      expect(lex.tokenized[0].name).toEqual('quantifier');
      expect(lex.tokenized[0].value).toEqual('{1,4}');
    });

    it ('should tokenize combinations', function() {
      var lex = new Lexer('\\d{2}/\\d{2}/\\d{4}');
      lex._tokenize();
      expect(lex.tokenized[0]).toEqual({ name: 'special', value: '\\d' });
      expect(lex.tokenized[1]).toEqual({ name: 'quantifier', value: '{2}' });
      expect(lex.tokenized[2]).toEqual({ name: 'literal', value: '/' });
      expect(lex.tokenized[3]).toEqual({ name: 'special', value: '\\d' });
      expect(lex.tokenized[4]).toEqual({ name: 'quantifier', value: '{2}' });
      expect(lex.tokenized[5]).toEqual({ name: 'literal', value: '/' });
      expect(lex.tokenized[6]).toEqual({ name: 'special', value: '\\d' });
      expect(lex.tokenized[7]).toEqual({ name: 'quantifier', value: '{4}' });
    });
  });
  
  describe ('generation', function() {
    
    var ALPHA = JSONEnforcer.__exec__('ALPHA'),
        ALPHA_COMBINED = JSONEnforcer.__exec__('ALPHA_COMBINED'),
        NUMERIC = JSONEnforcer.__exec__('NUMERIC'),
        ALPHA_NUMERIC = JSONEnforcer.__exec__('ALPHA_NUMERIC');
    
    it ('should generate an exact match for literal token', function() {
      var lex = new Lexer('a');
      expect(lex.generate()).toEqual('a');    
    });
        
    describe ('special characters', function() {
      
      it ('should generate alpha numeric for \\w', function() {
        var lex = new Lexer('\\w');
        expect(ALPHA_NUMERIC.split('')).toContain(lex.generate());
      });

      it ('should generate numeric for \\d', function() {
        var lex = new Lexer('\\d');
        expect(NUMERIC.split('')).toContain(lex.generate());
      });
    });

    describe ('sets', function() {
      
      it ('should generate simple set', function() {
        var lex = new Lexer('[abc]');
        expect(lex.generate()).toMatch(/[abc]/);
      });
      
      it ('should generate set with alpha range', function() {
        var lex = new Lexer('[a-g]');
        expect(lex.generate()).toMatch(/[a-g]/);        
      });
      
      it ('should generate set with number range', function() {
        var lex = new Lexer('[3-5]');
        expect(lex.generate()).toMatch(/[3-5]/);
      });
      
      it ('should generate set with special chars', function() {
        var lex = new Lexer('[abc\\d]');
        expect(lex.generate()).toMatch(/[abc\d]/);
      });
      
      it ('should generate complex set', function() {
        var lex = new Lexer('[a-g5-8]');
        expect(lex.generate()).toMatch(/[a-g5-8]/);
      });
    });
    
    describe ('quantifier', function() {
      
      it ('should generate 1 or more for +', function() {
        var lex = new Lexer('a+');
        expect(lex.generate()).toMatch(/a+/);        
      });
      
      it ('should generate 0 or more for *', function() {
        var lex = new Lexer('a*');
        expect(lex.generate()).toMatch(/a*/);        
      });
      
      it ('should generate a minimum', function() {
        var lex = new Lexer('a{1,}');
        expect(lex.generate()).toMatch(/a{1,}/);
      });
      
      it ('should generate a maximum', function() {
        var lex = new Lexer('a{,10}');
        expect(lex.generate()).toMatch(/a{0,10}/);
      });
      
      it ('should generate a range', function() {
        var lex = new Lexer('a{1,4}');
        expect(lex.generate()).toMatch(/a{1,4}/);
      });
    });
  });
});

describe ('JSONEnforcer.Template', function() {
  
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

});

describe ('JSONEnforcer.Stub', function() {
  
  var Person = {
    name: 'string',
    age: 'number',
    hobbies: [ 'string optional' ],
    friends: [
      {
        name: 'string',
        age: 'number'
      }
    ]
  };
  
  it ('should', function() {
    var template = new JSONEnforcer.Template(Person);
    expect(template.enforce(template.stub())).toBe(true);
  });
  
});  