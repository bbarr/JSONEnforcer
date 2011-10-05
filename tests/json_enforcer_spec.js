describe('JSONEnforcer', function() {

  describe('type checking', function() {

    var enforcer = new JSONEnforcer({}),
        a_string = '', a_number = 0, an_array = [], an_object = {};

    describe('#is_string', function() {

      it ('should return true for a string', function() {
        expect(enforcer._is_string(a_string)).toBe(true);
      });
    });

    describe('#is_number', function() {

      it ('should return true for a number', function() {
        expect(enforcer._is_number(a_number)).toBe(true);
      });
    });

    describe('#is_array', function() {

      it ('should return true for an array', function() {
        expect(enforcer._is_array(an_array)).toBe(true);
      });

      it ('should fail for an object', function() {
        expect(enforcer._is_array(an_object)).toBe(false);
      });
    });

    describe('#is_object', function() {

      it ('should return true for an object', function() {
        expect(enforcer._is_object(an_object)).toBe(true);
      });

      it ('should fail for an array', function() {
        expect(enforcer._is_object(an_array)).toBe(false);
      });
    });
  });
  
  it ('should handle strings', function() {
    expect(new JSONEnforcer({ name: 'string' }).ensure({ name: 'brendan' })).toBe(true);
  });
  
  it ('should handle numbers', function() {
    expect(new JSONEnforcer({ age: 'number' }).ensure({ age: 10 })).toBe(true);
  });
  
  it ('should handle arrays', function() {
    expect(new JSONEnforcer({ hobbies: 'array' }).ensure({ hobbies: [ 'guitar', 'hiking' ] })).toBe(true);
  });
  
  it ('should handle objects', function() {
    
    expect(new JSONEnforcer({ 
      attributes: {
        eyes: 'string', 
        hair: 'string'
      }
    }).ensure({
      attributes: { 
        eyes: 'blue', 
        hair: 'brown' 
      }
    })).toBe(true);    
  });
  
  it ('should enforce required strings', function() {
    expect(new JSONEnforcer({ name: 'string' }).ensure({})).toBe(true); 
    expect(new JSONEnforcer({ name: 'string required' }).ensure({})).toBe(false);
  });

  it ('should enforce required numbers', function() {
    expect(new JSONEnforcer({ age: 'number' }).ensure({})).toBe(true);
    expect(new JSONEnforcer({ age: 'number required' }).ensure({})).toBe(false);
  });
  
  it ('should enforce required arrays', function() {
    expect(new JSONEnforcer({ hobbies: [ 'string ' ] }).ensure({ hobbies: [] })).toBe(true);
    expect(new JSONEnforcer({ hobbies: [ 'string required' ] }).ensure({})).toBe(false);
  });
  
  it ('should enforce required objects by detection required properties', function() {
    
    expect(new JSONEnforcer({ 
      attributes: {
        eyes: 'string',
        hair: 'string'
      }
    }).ensure({
      attributes: {
        eyes: 'blue' 
      }
    })).toBe(true);
    
    expect(new JSONEnforcer({ 
      attributes: {
        eyes: 'string',
        hair: 'string required'
      }
    }).ensure({
      attributes: {
        eyes: 'blue' 
      }
    })).toBe(false);
  });
  
});